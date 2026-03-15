

import fetch from "node-fetch";
import crypto from "crypto";
import supabase from '../config/supabaseClient.js';

const BINANCE_BASE_URL = "https://api.binance.com";

// Helper function to get user credentials from database - FIXED VERSION
const getUserCredentialsFromDB = async (userId) => {
  if (!userId) {
    console.error('No user ID provided');
    return {};
  }

  console.log('Fetching credentials for user:', userId);
  
  // Don't use .single() - it throws if no record found
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user credentials:', error);
    return {};
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
//     return [];
//   }
// };


// Ethereum Wallet - COMPLETE FIXED VERSION
export const getEthereumPortfolio = async (ethAddress, etherscanApiKey) => {
  if (!ethAddress || !etherscanApiKey) {
    console.log('Missing Ethereum address or API key');
    return [];
  }

  // Try V2 API first (recommended)
  const ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api";
  const chainId = "1"; // Ethereum mainnet
  
  const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=tokentx&address=${ethAddress}&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;
  
  try {
    console.log('Fetching Ethereum portfolio for address:', ethAddress);
    
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
      
      return []; // Return empty array gracefully
    }
    
    // If we get here, data.result is definitely an array
    console.log(`Found ${data.result.length} transactions on Ethereum`);
    
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
      source: "ethereum",
    }));
    
    console.log(`Found ${result.length} assets in Ethereum portfolio`);
    return result;
    
  } catch (error) {
    console.error('Ethereum portfolio error:', error);
    return [];
  }
};

// Binance 
export const getBinancePortfolio = async ({ apiKey, apiSecret }) => {
  if (!apiKey || !apiSecret) return [];
  
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
    const url = `${BINANCE_BASE_URL}/api/v3/account?${queryString}&signature=${signature}`;
    const response = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.balances
      .map(b => ({ asset: b.asset, amount: parseFloat(b.free) + parseFloat(b.locked), source: "binance", tradeCount: 0 }))
      .filter(b => b.amount > 0)
      .map(b => ({ ...b, amount: parseFloat(b.amount.toFixed(8)) }));
  } catch (error) {
    console.error('Binance portfolio error:', error);
    return [];
  }
};

// KuCoin 
export const getKuCoinPortfolio = async ({ apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) return [];
  
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
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.data
      .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "kucoin", tradeCount: 0 }))
      .filter(a => a.amount > 0)
      .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }));
  } catch (error) {
    console.error('KuCoin portfolio error:', error);
    return [];
  }
};

// Coinbase 
export const getCoinbasePortfolio = async ({ apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) return [];
  
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
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data
      .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "coinbase", tradeCount: 0 }))
      .filter(a => a.amount > 0)
      .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }));
  } catch (error) {
    console.error('Coinbase portfolio error:', error);
    return [];
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
    const userCreds = await getUserCredentialsFromDB(userId);
    
    // Build promises array only for credentials that exist
    const promises = [];
    
    // Check each credential and add to promises if valid
    if (userCreds.ethAddress && userCreds.etherscanApiKey) {
      console.log('Adding Ethereum portfolio fetch');
      promises.push(getEthereumPortfolio(userCreds.ethAddress, userCreds.etherscanApiKey));
    } else {
      console.log('Skipping Ethereum - missing credentials');
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.binance?.apiKey && userCreds.binance?.apiSecret) {
      console.log('Adding Binance portfolio fetch');
      promises.push(getBinancePortfolio(userCreds.binance));
    } else {
      console.log('Skipping Binance - missing credentials');
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.kucoin?.apiKey && userCreds.kucoin?.apiSecret && userCreds.kucoin?.passphrase) {
      console.log('Adding KuCoin portfolio fetch');
      promises.push(getKuCoinPortfolio(userCreds.kucoin));
    } else {
      console.log('Skipping KuCoin - missing credentials');
      promises.push(Promise.resolve([]));
    }
    
    if (userCreds.coinbase?.apiKey && userCreds.coinbase?.apiSecret && userCreds.coinbase?.passphrase) {
      console.log('Adding Coinbase portfolio fetch');
      promises.push(getCoinbasePortfolio(userCreds.coinbase));
    } else {
      console.log('Skipping Coinbase - missing credentials');
      promises.push(Promise.resolve([]));
    }
    
    // Wait for all promises to resolve (some may be empty arrays)
    const results = await Promise.all(promises);
    
    // Flatten all results into a single array
    const allPortfolios = results.flat();
    
    console.log(`Total assets before merging: ${allPortfolios.length}`);
    
    // Merge duplicates across different sources
    const mergedPortfolio = allPortfolios.reduce((acc, cur) => {
      const existing = acc.find(a => a.asset === cur.asset);
      if (existing) {
        // Same asset from different sources - combine amounts
        existing.amount += cur.amount;
        existing.tradeCount = (existing.tradeCount || 0) + (cur.tradeCount || 0);
        // Track which sources this asset comes from
        existing.sources = existing.sources || [existing.source];
        if (!existing.sources.includes(cur.source)) {
          existing.sources.push(cur.source);
        }
        existing.source = existing.sources.join(', ');
      } else {
        // New asset
        acc.push({ 
          ...cur,
          sources: [cur.source]
        });
      }
      return acc;
    }, []);
    
    // Sort by amount (descending)
    mergedPortfolio.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    
    console.log(`Final portfolio has ${mergedPortfolio.length} unique assets`);
    
    res.status(200).json({ 
      success: true,
      portfolio: mergedPortfolio,
      summary: {
        totalUniqueAssets: mergedPortfolio.length,
        sources: {
          ethereum: results[0]?.length || 0,
          binance: results[1]?.length || 0,
          kucoin: results[2]?.length || 0,
          coinbase: results[3]?.length || 0
        }
      }
    });
    
  } catch (err) {
    console.error("Unified Portfolio Error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};