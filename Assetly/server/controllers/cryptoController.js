import fetch from "node-fetch";
import crypto from "crypto";
import supabase from '../config/supabaseClient.js';
import axios from "axios";

const BINANCE_BASE_URL = "https://api.binance.com";

// Helper function to set the api status of the user
const setUserApiStatus = async (userId, apiName, status) => {
  const { error } = await supabase
    .from("accounts")
    .update({ [apiName]: status })
    .eq("user_id", userId);

  if (error) {
    console.error(
      `Failed to update ${apiName}:`,
      error
    );
  }
}

// Helper function to check if the crypto data should be refreshed
const shouldRefreshCrypto = async (userId) => {

  const { data } = await supabase
    .from("accounts")
    .select("crypto_last_sync")
    .eq("user_id", userId)
    .single();

  if (!data?.crypto_last_sync)
    return true;

  const diff =
    Date.now() -
    new Date(data.crypto_last_sync).getTime();

  return diff > 15 * 60 * 1000;
}

// Helper function to update the last sync time for crypto data
const updateCryptoSyncTime = async (userId) => {

  await supabase
    .from("accounts")
    .update({

      crypto_last_sync:
        new Date().toISOString()

    })
    .eq("user_id", userId);

}

// Helper function to upsert crypto transactions into the database
const upsertCryptoTransactions = async (userId, portfolio) => {
  const rows = portfolio.map(asset => ({
    user_id: userId,

    platform: asset.source,

    external_id: `${userId}_${asset.source}_${asset.asset}`,

    transaction_date: new Date().toISOString(),

    asset_type: "crypto",

    entity: asset.asset,

    side: "HOLDING",

    quantity: asset.amount,

    price: null,

    amount: asset.amount,

    fee: 0,

    raw: asset
  }));

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, {
      onConflict: "external_id"
    });

  if (error) {
    console.log(error);
  }
}

// Helper function to get crypto portfolio from database
const getCryptoPortfolioFromDB = async (userId) => {

  console.log("================================");
  console.log("FETCHING TRANSACTIONS");
  console.log("USER ID:", userId);
  console.log("================================");

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId);

  console.log("TRANSACTION ERROR:", error);
  console.log("TRANSACTION ROWS:", data);
  console.log("TRANSACTION COUNT:", data?.length);

  if (error) {
    console.log(error);
    return [];
  }

  const merged = {};

  data.forEach(tx => {

    console.log("TX:", {
      user_id: tx.user_id,
      platform: tx.platform,
      entity: tx.entity,
      quantity: tx.quantity
    });

    if (![
      "Ethereum Wallet",
      "Binance",
      "Kucoin",
      "Coinbase",
      "Crypto"
    ].includes(tx.platform)) {
      console.log("IGNORING PLATFORM:", tx.platform);
      return;
    }

    if (!merged[tx.entity]) {
      merged[tx.entity] = {
        asset: tx.entity,
        amount: 0,
        tradeCount: 0,
        sources: []
      };
    }

    merged[tx.entity].amount += Number(tx.quantity);

    if (!merged[tx.entity].sources.includes(tx.platform)) {
      merged[tx.entity].sources.push(tx.platform);
    }
  });

  const result = Object.values(merged)
    .sort((a, b) => b.amount - a.amount);

  console.log("FINAL DB PORTFOLIO:", result);

  return result;
};

// Helper function to get user credentials from database - FIXED VERSION
const getUserCredentialsFromDB = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  console.log('Fetching credentials for user:', userId);

  // Don't use .single() - it throws if no record found
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user credentials:', error);
    throw new Error(error.message);
  }

  // Check if we got any data back
  if (!data || data.length === 0) {
    console.log('No account record found for user:', userId);
    // Return empty credentials - user hasn't connected any accounts yet
    return {
      ethAddress: null,
      etherscanApiKey: null,
      binance: { apiKey: null, apiSecret: null },
      kucoin: { apiKey: null, apiSecret: null, passphrase: null },
      coinbase: { apiKey: null, apiSecret: null, passphrase: null }
    };
  }

  // Use the first record (should be only one per user)
  const account = data[0];
  console.log('Found account record for user:', userId);

  // Note: Based on your schema, the field names might be different
  // Make sure these match your actual column names in the database
  return {
    ethAddress: account?.eth_address || null,
    etherscanApiKey: account?.etherscan_api_key || null,
    binance: {
      apiKey: account?.binance_api_key || null,
      apiSecret: account?.binance_api_secret || null,
    },
    kucoin: {
      apiKey: account?.kucoin_api_key || null,
      apiSecret: account?.kucoin_api_secret || null,
      passphrase: account?.kucoin_passphrase || null,
    },
    coinbase: {
      apiKey: account?.coinbase_api_key || null,
      apiSecret: account?.coinbase_api_secret || null,
      passphrase: account?.coinbase_passphrase || null,
    },
  };
};

// Get last 6 months crypto snapshots
const getCryptoSnapshots = async (userId) => {
  const { data, error } = await supabase
    .from("monthly_account_snapshots")
    .select(`
      snapshot_month,
      crypto_balance
    `)
    .eq("user_id", userId)
    .order("snapshot_month", { ascending: false })
    .limit(6);

  if (error) {
    console.error(error);
    return [];
  }

  // Return oldest -> newest
  return data.reverse().map(item => ({
    month: new Date(item.snapshot_month).toLocaleString("default", {
      month: "short",
    }),
    value: Number(item.crypto_balance) || 0,
  }));
};

// // Ethereum Wallet 
// export const getEthereumPortfolio = async (ethAddress, etherscanApiKey) => {
//   if (!ethAddress || !etherscanApiKey) return [];
//   const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";
//   const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${ethAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;

//   try {
//     const response = await fetch(url);
//     const data = await response.json();
//     if (!data.result) return [];

//     const assetData = {};
//     data.result.forEach(tx => {
//       const symbol = tx.tokenSymbol || "UNKNOWN";
//       const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || "18"));
//       if (!assetData[symbol]) assetData[symbol] = { amount: 0, trades: 0 };
//       if (tx.to.toLowerCase() === ethAddress.toLowerCase()) assetData[symbol].amount += amount;
//       if (tx.from.toLowerCase() === ethAddress.toLowerCase()) assetData[symbol].amount -= amount;
//       assetData[symbol].trades += 1;
//     });

//     // Clean weird/dust tokens
//     const cleanedData = { "Other Tokens": { amount: 0, trades: 0 } };
//     Object.entries(assetData).forEach(([asset, { amount, trades }]) => {
//       const roundedAmount = parseFloat(amount.toFixed(6));
//       const isWeird = asset.length > 10 || asset.length <= 2 || /^[0-9]+$/.test(asset);
//       const isDust = Math.abs(roundedAmount) < 0.01;
//       if (isWeird || isDust) {
//         cleanedData["Other Tokens"].amount += roundedAmount;
//         cleanedData["Other Tokens"].trades += trades;
//       } else {
//         cleanedData[asset] = { amount: roundedAmount, trades };
//       }
//     });

//     return Object.entries(cleanedData).map(([asset, { amount, trades }]) => ({
//       asset,
//       amount,
//       tradeCount: trades,
//       source: "ethereum",
//     }));
//   } catch (error) {
//     console.error('Ethereum portfolio error:', error);
//     return {
//    connected: false,
//    portfolio: [],
//};
//   }
// };


// Ethereum Wallet - COMPLETE FIXED VERSION
export const getEthereumWalletPortfolio = async (userId, ethAddress, etherscanApiKey) => {
  if (!ethAddress || !etherscanApiKey) {
    console.log('Missing Ethereum Wallet address or API key');
    return {
      connected: false,
      portfolio: [],
    }
  }

  // Try V2 API first (recommended)
  const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";
  const chainId = "1"; // Ethereum Wallet mainnet

  const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=tokentx&address=${ethAddress}&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;

  try {
    console.log('Fetching Ethereum Wallet portfolio for address:', ethAddress);

    const response = await fetch(url);
    const data = await response.json();

    // CRITICAL FIX: Check if result is an array before using forEach
    if (!Array.isArray(data.result)) {
      // Log what we got instead (usually an error message)
      console.log('Etherscan returned non-array result:', data.message || data.result || 'Unknown error');

      // Check if it's the V1 deprecation warning
      if (typeof data.result === 'string' && data.result.includes('deprecated')) {
        console.log('Please ensure you are using Etherscan API V2 with a valid API key');
      }
      await setUserApiStatus(userId, 'eth_api_status', false);

      return {
        connected: false,
        portfolio: [],
      };
    }

    // If we get here, data.result is definitely an array
    console.log(`Found ${data.result.length} transactions on Ethereum Wallet`);

    const assetData = {};

    data.result.forEach(tx => {
      const symbol = tx.tokenSymbol || "UNKNOWN";
      const decimals = parseInt(tx.tokenDecimal || "18");
      const amount = parseFloat(tx.value) / Math.pow(10, decimals);

      if (!assetData[symbol]) {
        assetData[symbol] = { amount: 0, trades: 0 };
      }

      if (tx.to && tx.to.toLowerCase() === ethAddress.toLowerCase()) {
        assetData[symbol].amount += amount;
      }
      if (tx.from && tx.from.toLowerCase() === ethAddress.toLowerCase()) {
        assetData[symbol].amount -= amount;
      }
      assetData[symbol].trades += 1;
    });

    // Clean weird/dust tokens
    const cleanedData = {};
    let otherTokensAmount = 0;
    let otherTokensTrades = 0;

    Object.entries(assetData).forEach(([asset, { amount, trades }]) => {
      const roundedAmount = parseFloat(amount.toFixed(6));
      const isWeird = asset.length > 10 || asset.length <= 2 || /^[0-9]+$/.test(asset);
      const isDust = Math.abs(roundedAmount) < 0.01;

      if (isWeird || isDust) {
        otherTokensAmount += roundedAmount;
        otherTokensTrades += trades;
      } else {
        cleanedData[asset] = { amount: roundedAmount, trades };
      }
    });

    if (Math.abs(otherTokensAmount) > 0.000001) {
      cleanedData["Other Tokens"] = { amount: otherTokensAmount, trades: otherTokensTrades };
    }

    const result = Object.entries(cleanedData).map(([asset, { amount, trades }]) => ({
      asset,
      amount: parseFloat(amount.toFixed(6)),
      tradeCount: trades,
      source: "Ethereum Wallet",
    }));

    console.log(`Found ${result.length} assets in Ethereum Wallet portfolio`);
    await setUserApiStatus(userId, 'ethereum_wallet_api_status', true);
    return {
      connected: true,
      portfolio: result,
    };

  } catch (error) {
    console.error('Ethereum Wallet portfolio error:', error);
    await setUserApiStatus(userId, 'eth_api_status', false);
    return {
      connected: false,
      portfolio: [],
    };
  }
};

// Binance 
export const getBinancePortfolio = async ({ userId, apiKey, apiSecret }) => {
  if (!apiKey || !apiSecret) {
    return {
      connected: false,
      portfolio: [],
    }
  }

  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
    const url = `${BINANCE_BASE_URL}/api/v3/account?${queryString}&signature=${signature}`;
    const response = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });

    if (!response.ok) {
      await setUserApiStatus(userId, 'binance_api_status', false);
      return {
        connected: false,
        portfolio: [],
      };
    }

    const data = await response.json();
    await setUserApiStatus(userId, 'binance_api_status', true);
    return {
      connected: true,
      portfolio: data.balances
        .map(b => ({ asset: b.asset, amount: parseFloat(b.free) + parseFloat(b.locked), source: "binance", tradeCount: 0 }))
        .filter(b => b.amount > 0)
        .map(b => ({ ...b, amount: parseFloat(b.amount.toFixed(8)) }))
    };

  } catch (error) {
    console.error('Binance portfolio error:', error);
    await setUserApiStatus(userId, 'binance_api_status', false);
    return {
      connected: false,
      portfolio: [],
    };
  }
};

// KuCoin 
export const getKuCoinPortfolio = async ({ userId, apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) {
    return {
      connected: false,
      portfolio: [],
    }
  }

  try {
    const timestamp = Date.now().toString();
    const method = "GET";
    const endpoint = "/api/v1/accounts";
    const body = "";
    const prehash = timestamp + method + endpoint + body;
    const signature = crypto.createHmac("sha256", apiSecret).update(prehash).digest("base64");
    const encryptedPassphrase = crypto.createHmac("sha256", apiSecret).update(passphrase).digest("base64");

    const response = await fetch(`https://api.kucoin.com${endpoint}`, {
      headers: {
        "KC-API-KEY": apiKey,
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": encryptedPassphrase,
        "KC-API-KEY-VERSION": "2",
      },
    });

    if (!response.ok) {
      await setUserApiStatus(userId, 'kucoin_api_status', false);
      return {
        connected: false,
        portfolio: []
      };
    }

    const data = await response.json();
    await setUserApiStatus(userId, 'kucoin_api_status', true);
    return {
      connected: true,
      portfolio: data.data
        .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "kucoin", tradeCount: 0 }))
        .filter(a => a.amount > 0)
        .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }))
    };

  } catch (error) {
    console.error('KuCoin portfolio error:', error);
    await setUserApiStatus(userId, 'kucoin_api_status', false);
    return {
      connected: false,
      portfolio: [],
    };
  }
};

// Coinbase 
export const getCoinbasePortfolio = async ({ userId, apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) {
    return {
      connected: false,
      portfolio: [],
    }
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const requestPath = "/accounts";
    const body = "";
    const message = timestamp + method + requestPath + body;
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("base64");

    const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "CB-ACCESS-PASSPHRASE": passphrase,
      },
    });

    if (!response.ok) {
      await setUserApiStatus(userId, 'coinbase_api_status', false);
      return {
        connected: false,
        portfolio: []
      };
    }

    const data = await response.json();
    await setUserApiStatus(userId, 'coinbase_api_status', true);

    return {
      connected: true,
      portfolio: data   // i mish made this change from data.data as described by GPT
        .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "coinbase", tradeCount: 0 }))
        .filter(a => a.amount > 0)
        .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }))
    };

  } catch (error) {
    console.error('Coinbase portfolio error:', error);
    await setUserApiStatus(userId, 'coinbase_api_status', false);
    return {
      connected: false,
      portfolio: [],
    };
  }
};



export const getCoinGeckoData = async (req, res) => {
  try {
    const { symbols } = req.body;

    const coinMapping = {
      BTC: "bitcoin",
      ETH: "ethereum",
      BNB: "binancecoin",
      SOL: "solana",
      XRP: "ripple",
      DOGE: "dogecoin",
      ADA: "cardano",
      LTC: "litecoin",
      TRX: "tron",
      AVAX: "avalanche-2"
    };

    const ids = [
      ...new Set(
        symbols
          .map(s => coinMapping[s.toUpperCase()])
          .filter(Boolean)
      )
    ];

    const [pricesRes, marketRes] = await Promise.all([
      axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: ids.join(","),
            vs_currencies: "usd",
            include_24hr_change: true
          }
        }
      ),

      axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: 4,
            page: 1,
            sparkline: false
          }
        }
      )
    ]);

    const symbolPrices = {};

    Object.entries(coinMapping).forEach(([symbol, coinId]) => {
      if (pricesRes.data[coinId]) {
        symbolPrices[symbol] = pricesRes.data[coinId];
      }
    });

    res.json({
      success: true,
      prices: symbolPrices,
      market: marketRes.data
    });

  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch CoinGecko data"
    });
  }
};


// Unified Controller - Only calls APIs for available credentials
export const getUserCryptoPortfolio = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const userId = user.id;
    const refreshNeeded = await shouldRefreshCrypto(userId);
    console.log("Refresh needed:", refreshNeeded);
    const userCreds = await getUserCredentialsFromDB(userId);

    let ethereumWallet = { connected: false, portfolio: [] };
    let binance = { connected: false, portfolio: [] };
    let kucoin = { connected: false, portfolio: [] };
    let coinbase = { connected: false, portfolio: [] };

    if (refreshNeeded) {
      // Build promises object only for credentials that exist
      const promises = {
        ethereumWallet: null,
        binance: null,
        kucoin: null,
        coinbase: null,
      };

      // Check each credential and add to promises if valid
      if (userCreds.ethAddress && userCreds.etherscanApiKey) {
        console.log('Adding Ethereum Wallet portfolio fetch');
        promises.ethereumWallet = getEthereumWalletPortfolio(userId, userCreds.ethAddress, userCreds.etherscanApiKey);
      } else {
        console.log('Skipping Ethereum Wallet - missing credentials');
      }

      if (userCreds.binance?.apiKey && userCreds.binance?.apiSecret) {
        console.log('Adding Binance portfolio fetch');
        promises.binance = getBinancePortfolio({ userId, ...userCreds.binance });
      } else {
        console.log('Skipping Binance - missing credentials');
      }

      if (userCreds.kucoin?.apiKey && userCreds.kucoin?.apiSecret && userCreds.kucoin?.passphrase) {
        console.log('Adding KuCoin portfolio fetch');
        promises.kucoin = getKuCoinPortfolio({ userId, ...userCreds.kucoin });
      } else {
        console.log('Skipping KuCoin - missing credentials');
      }

      if (userCreds.coinbase?.apiKey && userCreds.coinbase?.apiSecret && userCreds.coinbase?.passphrase) {
        console.log('Adding Coinbase portfolio fetch');
        promises.coinbase = getCoinbasePortfolio({ userId, ...userCreds.coinbase });
      } else {
        console.log('Skipping Coinbase - missing credentials');
      }

      // Wait for all promises to resolve (some may be empty arrays)
      [ethereumWallet, binance, kucoin, coinbase] = await Promise.all([
        promises.ethereumWallet ?? Promise.resolve({
          connected: false,
          portfolio: []
        }),
        promises.binance ?? Promise.resolve({
          connected: false,
          portfolio: []
        }),
        promises.kucoin ?? Promise.resolve({
          connected: false,
          portfolio: []
        }),
        promises.coinbase ?? Promise.resolve({
          connected: false,
          portfolio: []
        }),
      ]);

      // Flatten all results into a single array
      const allPortfolios = [ethereumWallet, binance, kucoin, coinbase].flatMap(
        result => result.portfolio
      );

      console.log(`Total assets before merging: ${allPortfolios.length}`);


      await upsertCryptoTransactions(userId, allPortfolios);
      await updateCryptoSyncTime(userId);
    }
    const portfolioFromDB = await getCryptoPortfolioFromDB(userId);

    // Sort by amount (descending)
    portfolioFromDB.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const totalCryptoBalance = portfolioFromDB.reduce(
      (sum, asset) => sum + asset.amount,
      0
    );

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        crypto_balance: totalCryptoBalance,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "Error updating crypto balance:",
        updateError
      );
    }

    console.log(`Final portfolio has ${portfolioFromDB.length} unique assets`);
    const cryptoSnapshots = await getCryptoSnapshots(userId);

    res.status(200).json({
      success: true,
      portfolio: portfolioFromDB,
      cryptoSnapshots,
      summary: {
        apiStatus: {
          ethereumWallet: ethereumWallet?.connected || false,
          binance: binance?.connected || false,
          kucoin: kucoin?.connected || false,
          coinbase: coinbase?.connected || false,
        },

        totalUniqueAssets: portfolioFromDB.length,

        sources: {
          ethereumWallet: ethereumWallet?.portfolio?.length || 0,
          binance: binance?.portfolio?.length || 0,
          kucoin: kucoin?.portfolio?.length || 0,
          coinbase: coinbase?.portfolio?.length || 0,
        }
      }
    });

  } catch (err) {
    console.error("Crypto Portfolio Error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};