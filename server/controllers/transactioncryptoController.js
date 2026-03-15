import fetch from "node-fetch";
import crypto from "crypto";
import { supabase } from "../config/supabaseClient.js"; 

const BINANCE_BASE_URL = "https://api.binance.com";

// You need to add this helper function at the top!
const getUserCredentialsFromDB = async (userId) => {
  if (!userId) {
    console.error('No user ID provided');
    return {};
  }

  console.log('Fetching credentials for user:', userId);
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user credentials:', error);
    return {};
  }

  if (!data || data.length === 0) {
    console.log('No account record found for user:', userId);
    return {
      ethAddress: null,
      etherscanApiKey: null,
      binance: { apiKey: null, apiSecret: null },
      kucoin: { apiKey: null, apiSecret: null, passphrase: null },
      coinbase: { apiKey: null, apiSecret: null, passphrase: null }
    };
  }

  const account = data[0];
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

const saveTransactionsToDB = async (userId, transactions) => {
  if (!transactions.length) return;

  const rows = transactions.map((tx) => ({
    user_id: userId,
    account: tx.account,
    transaction_date: tx.transaction_date,
    entity: tx.entity,
    quantity: tx.quantity,
    amount: tx.amount,
  }));

  const { error } = await supabase.from("transactions").insert(rows);

  if (error) {
    console.error("DB Insert Error:", error.message);
  }
};

export const getEthereumTransactions = async (ethAddress, etherscanApiKey) => {
  if (!ethAddress || !etherscanApiKey) return [];

  // Update to V2 API to avoid deprecation warnings
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${ethAddress}&sort=desc&apikey=${etherscanApiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!Array.isArray(data.result)) {
      console.log('Etherscan returned non-array result:', data.message);
      return [];
    }

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    return data.result
      .filter((tx) => new Date(tx.timeStamp * 1000) >= twoMonthsAgo)
      .map((tx) => ({
        account: "ethereum",
        transaction_date: new Date(tx.timeStamp * 1000),
        entity: tx.tokenSymbol || "UNKNOWN",
        quantity:
          parseFloat(tx.value) /
          Math.pow(10, parseInt(tx.tokenDecimal || "18")),
        amount: 0,
      }));
  } catch (error) {
    console.error('Ethereum transactions error:', error);
    return [];
  }
};

export const getBinanceTransactions = async ({ apiKey, apiSecret }) => {
  if (!apiKey || !apiSecret) return [];

  try {
    const timestamp = Date.now();
    const startTime = timestamp - 60 * 24 * 60 * 60 * 1000; // ~60 days

    const queryString = `timestamp=${timestamp}&startTime=${startTime}`;
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const url = `${BINANCE_BASE_URL}/api/v3/myTrades?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: { "X-MBX-APIKEY": apiKey },
    });

    if (!response.ok) return [];
    const data = await response.json();

    return data.map((tx) => ({
      account: "binance",
      transaction_date: new Date(tx.time),
      entity: tx.symbol,
      quantity: parseFloat(tx.qty),
      amount: parseFloat(tx.price),
    }));
  } catch (error) {
    console.error('Binance transactions error:', error);
    return [];
  }
};

export const getKuCoinTransactions = async ({
  apiKey,
  apiSecret,
  passphrase,
}) => {
  if (!apiKey || !apiSecret || !passphrase) return [];

  try {
    const timestamp = Date.now().toString();
    const method = "GET";
    const endpoint = "/api/v1/fills";

    const startAt = Date.now() - 60 * 24 * 60 * 60 * 1000;

    const query = `?startAt=${startAt}`;
    const prehash = timestamp + method + endpoint + query;

    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(prehash)
      .digest("base64");

    const encryptedPassphrase = crypto
      .createHmac("sha256", apiSecret)
      .update(passphrase)
      .digest("base64");

    const response = await fetch(
      `https://api.kucoin.com${endpoint}${query}`,
      {
        headers: {
          "KC-API-KEY": apiKey,
          "KC-API-SIGN": signature,
          "KC-API-TIMESTAMP": timestamp,
          "KC-API-PASSPHRASE": encryptedPassphrase,
          "KC-API-KEY-VERSION": "2",
        },
      }
    );

    if (!response.ok) return [];
    const data = await response.json();

    if (!data.data || !data.data.items) return [];

    return data.data.items.map((tx) => ({
      account: "kucoin",
      transaction_date: new Date(tx.createdAt),
      entity: tx.symbol,
      quantity: parseFloat(tx.size),
      amount: parseFloat(tx.price),
    }));
  } catch (error) {
    console.error('KuCoin transactions error:', error);
    return [];
  }
};

export const getCoinbaseTransactions = async ({
  apiKey,
  apiSecret,
  passphrase,
}) => {
  if (!apiKey || !apiSecret || !passphrase) return [];

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const requestPath = "/fills";

    const message = timestamp + method + requestPath;

    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(message)
      .digest("base64");

    const response = await fetch(
      `https://api.exchange.coinbase.com${requestPath}`,
      {
        headers: {
          "CB-ACCESS-KEY": apiKey,
          "CB-ACCESS-SIGN": signature,
          "CB-ACCESS-TIMESTAMP": timestamp,
          "CB-ACCESS-PASSPHRASE": passphrase,
        },
      }
    );

    if (!response.ok) return [];
    const data = await response.json();

    if (!Array.isArray(data)) return [];

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    return data
      .filter((tx) => new Date(tx.created_at) >= twoMonthsAgo)
      .map((tx) => ({
        account: "coinbase",
        transaction_date: new Date(tx.created_at),
        entity: tx.product_id,
        quantity: parseFloat(tx.size),
        amount: parseFloat(tx.price),
      }));
  } catch (error) {
    console.error('Coinbase transactions error:', error);
    return [];
  }
};

// FIXED: Only call APIs for credentials that exist
export const getUserTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userCreds = await getUserCredentialsFromDB(userId);
    
    // Build promises array only for credentials that exist
    const promises = [];
    
    if (userCreds.ethAddress && userCreds.etherscanApiKey) {
      promises.push(getEthereumTransactions(userCreds.ethAddress, userCreds.etherscanApiKey));
    } else {
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.binance?.apiKey && userCreds.binance?.apiSecret) {
      promises.push(getBinanceTransactions(userCreds.binance));
    } else {
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.kucoin?.apiKey && userCreds.kucoin?.apiSecret && userCreds.kucoin?.passphrase) {
      promises.push(getKuCoinTransactions(userCreds.kucoin));
    } else {
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.coinbase?.apiKey && userCreds.coinbase?.apiSecret && userCreds.coinbase?.passphrase) {
      promises.push(getCoinbaseTransactions(userCreds.coinbase));
    } else {
      promises.push(Promise.resolve([]));
    }

    const results = await Promise.all(promises);
    
    // Flatten all transactions
    const allTransactions = results.flat();
    
    // Save to DB if there are any transactions
    if (allTransactions.length > 0) {
      await saveTransactionsToDB(userId, allTransactions);
    }

    res.status(200).json({
      success: true,
      total: allTransactions.length,
      transactions: allTransactions,
      summary: {
        ethereum: results[0]?.length || 0,
        binance: results[1]?.length || 0,
        kucoin: results[2]?.length || 0,
        coinbase: results[3]?.length || 0
      }
    });
  } catch (err) {
    console.error("Unified Transaction Error:", err);
    res.status(500).json({ error: err.message });
  }
};