import fetch from "node-fetch";
import crypto from "crypto";
import { supabase } from "../config/supabaseClient.js";

const BINANCE_BASE_URL = "https://api.binance.com";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
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

export const getEthereumTransactionsToday = async (
  ethAddress,
  etherscanApiKey
) => {
  if (!ethAddress || !etherscanApiKey) {
    console.log('Skipping Ethereum - missing credentials');
    return [];
  }

  try {
    const { start, end } = getTodayRange();
    
    // Use V2 API to avoid deprecation
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${ethAddress}&sort=desc&apikey=${etherscanApiKey}`;

    const response = await fetch(url);
    const data = await response.json();
    
    if (!Array.isArray(data.result)) {
      console.log('Etherscan returned non-array result:', data.message);
      return [];
    }

    return data.result
      .filter((tx) => {
        const txDate = new Date(tx.timeStamp * 1000);
        return txDate >= start && txDate <= end;
      })
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

export const getBinanceTransactionsToday = async ({ apiKey, apiSecret }) => {
  if (!apiKey || !apiSecret) {
    console.log('Skipping Binance - missing credentials');
    return [];
  }

  try {
    const { start, end } = getTodayRange();

    const timestamp = Date.now();
    const startTime = start.getTime();
    const endTime = end.getTime();

    const queryString = `timestamp=${timestamp}&startTime=${startTime}&endTime=${endTime}`;
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const url = `${BINANCE_BASE_URL}/api/v3/myTrades?${queryString}&signature=${signature}`;

    const response = await fetch(url, {
      headers: { "X-MBX-APIKEY": apiKey },
    });

    if (!response.ok) {
      console.log('Binance API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

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

export const getKuCoinTransactionsToday = async ({
  apiKey,
  apiSecret,
  passphrase,
}) => {
  if (!apiKey || !apiSecret || !passphrase) {
    console.log('Skipping KuCoin - missing credentials');
    return [];
  }

  try {
    const { start, end } = getTodayRange();

    const timestamp = Date.now().toString();
    const method = "GET";
    const endpoint = "/api/v1/fills";

    const startAt = start.getTime();
    const endAt = end.getTime();

    const query = `?startAt=${startAt}&endAt=${endAt}`;
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

    if (!response.ok) {
      console.log('KuCoin API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data.items)) return [];

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

export const getCoinbaseTransactionsToday = async ({
  apiKey,
  apiSecret,
  passphrase,
}) => {
  if (!apiKey || !apiSecret || !passphrase) {
    console.log('Skipping Coinbase - missing credentials');
    return [];
  }

  try {
    const { start, end } = getTodayRange();

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

    if (!response.ok) {
      console.log('Coinbase API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data
      .filter((tx) => {
        const txDate = new Date(tx.created_at);
        return txDate >= start && txDate <= end;
      })
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

// FIXED: Daily sync with proper error handling and conditional checks
export const dailyTransactionSync = async (req, res) => {
  try {
    console.log("Running Daily Transaction Sync...");
    
    // Fix: Use correct table name 'accounts' not 'user_credentials'
    const { data: users, error } = await supabase
      .from("accounts")
      .select("*");

    if (error) throw error;
    
    if (!users || users.length === 0) {
      console.log("No users found");
      return res.status(200).json({
        success: true,
        message: "No users to sync",
      });
    }

    let totalTransactions = 0;
    let usersProcessed = 0;

    for (const user of users) {
      try {
        const userId = user.user_id;
        console.log(`Processing user: ${userId}`);

        // Build promises only for credentials that exist
        const promises = [];

        // Ethereum
        if (user.eth_address && user.etherscan_api_key) {
          promises.push(getEthereumTransactionsToday(user.eth_address, user.etherscan_api_key));
        } else {
          promises.push(Promise.resolve([]));
        }

        // Binance
        if (user.binance_api_key && user.binance_api_secret) {
          promises.push(getBinanceTransactionsToday({
            apiKey: user.binance_api_key,
            apiSecret: user.binance_api_secret,
          }));
        } else {
          promises.push(Promise.resolve([]));
        }

        // KuCoin
        if (user.kucoin_api_key && user.kucoin_api_secret && user.kucoin_passphrase) {
          promises.push(getKuCoinTransactionsToday({
            apiKey: user.kucoin_api_key,
            apiSecret: user.kucoin_api_secret,
            passphrase: user.kucoin_passphrase,
          }));
        } else {
          promises.push(Promise.resolve([]));
        }

        // Coinbase
        if (user.coinbase_api_key && user.coinbase_api_secret && user.coinbase_passphrase) {
          promises.push(getCoinbaseTransactionsToday({
            apiKey: user.coinbase_api_key,
            apiSecret: user.coinbase_api_secret,
            passphrase: user.coinbase_passphrase,
          }));
        } else {
          promises.push(Promise.resolve([]));
        }

        const results = await Promise.all(promises);
        const allTx = results.flat();

        if (allTx.length > 0) {
          await saveTransactionsToDB(userId, allTx);
          totalTransactions += allTx.length;
          console.log(`Saved ${allTx.length} transactions for user ${userId}`);
        } else {
          console.log(`No transactions today for user ${userId}`);
        }

        usersProcessed++;

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        // Continue with next user even if one fails
        continue;
      }
    }

    res.status(200).json({
      success: true,
      message: "Daily Transaction Sync Completed",
      stats: {
        usersProcessed,
        totalTransactions,
      },
    });

  } catch (err) {
    console.error("Daily Sync Error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};