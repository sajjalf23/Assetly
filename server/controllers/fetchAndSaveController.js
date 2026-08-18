import fetch from "node-fetch";
import crypto from "crypto";
import supabase from '../config/supabaseClient.js';

const BINANCE_BASE_URL = "https://api.binance.com";
const KUCOIN_BASE_URL = "https://api.kucoin.com";
const COINBASE_BASE_URL = "https://api.exchange.coinbase.com";

// ======================================================
// HELPER: GET USER CREDENTIALS - FIXED VERSION
// ======================================================
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

// ======================================================
// SAVE TRANSACTIONS TO DB - FIXED VERSION
// ======================================================
export const saveTransactionsToDB = async (userId, transactions, isInitialFetch = false) => {
  console.log(`[saveTransactionsToDB] Saving ${transactions?.length || 0} transactions for user ${userId}`);

  if (!transactions || !transactions.length) {
    console.log(`[saveTransactionsToDB] No transactions to save`);
    return 0;
  }

  let savedCount = 0;
  let errorCount = 0;

  // Process each transaction individually
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    try {
      // Convert date properly
      let transactionDate;
      if (tx.transaction_date instanceof Date) {
        transactionDate = tx.transaction_date.toISOString();
      } else if (typeof tx.transaction_date === 'string') {
        transactionDate = new Date(tx.transaction_date).toISOString();
      } else if (typeof tx.transaction_date === 'number') {
        transactionDate = new Date(tx.transaction_date).toISOString();
      } else {
        transactionDate = new Date().toISOString();
      }

      // Prepare clean data matching your schema
      const transactionData = {
        user_id: userId,
        account: String(tx.account || 'unknown'),
        external_id: String(tx.external_id || `${tx.account}_${Date.now()}_${i}`),
        transaction_date: transactionDate,
        entity: String(tx.entity || 'UNKNOWN'),
        side: tx.side ? String(tx.side).toUpperCase() : null,
        quantity: Number(tx.quantity) || 0,
        price: tx.price ? Number(tx.price) : null,
        amount: tx.amount ? Number(tx.amount) : null,
        fee: tx.fee ? Number(tx.fee) : 0,
        raw: tx.raw || null
      };

      // Use upsert to handle duplicates gracefully
      const { error: upsertError } = await supabase
        .from('transactions')
        .upsert(transactionData, {
          onConflict: 'user_id,account,external_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error(`[saveTransactionsToDB] Error saving tx ${i + 1}:`, upsertError.message);
        errorCount++;
      } else {
        savedCount++;
      }

    } catch (err) {
      console.error(`[saveTransactionsToDB] Exception for tx ${i + 1}:`, err.message);
      errorCount++;
    }
  }

  console.log(`[saveTransactionsToDB] Complete - Saved: ${savedCount}, Errors: ${errorCount}`);
  return savedCount;
};

// ======================================================
// ETHEREUM TRANSACTIONS - FIXED VERSION
// ======================================================
export const getEthereumTransactions = async (ethAddress, etherscanApiKey) => {
  console.log(`[getEthereumTransactions] Fetching for address: ${ethAddress?.substring(0, 15)}...`);

  if (!ethAddress || !etherscanApiKey) {
    console.log(`[getEthereumTransactions] Missing credentials`);
    return [];
  }

  try {
    // Use V2 API endpoint
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${ethAddress}&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Check if we got a valid array
    if (!Array.isArray(data.result)) {
      console.log(`[getEthereumTransactions] No valid transaction data`);
      return [];
    }

    console.log(`[getEthereumTransactions] Found ${data.result.length} transactions`);

    const mapped = data.result.map((tx) => {
      let decimals = parseInt(tx.tokenDecimal);
      if (isNaN(decimals)) decimals = 18;

      let quantity = 0;
      try {
        const rawValue = tx.value || "0";
        quantity = parseFloat(rawValue) / Math.pow(10, decimals);
        if (isNaN(quantity)) quantity = 0;
      } catch (err) {
        quantity = 0;
      }

      const isBuy = tx.to?.toLowerCase() === ethAddress.toLowerCase();

      return {
        account: "ethereum",
        external_id: tx.hash,
        transaction_date: new Date(parseInt(tx.timeStamp) * 1000),
        entity: tx.tokenSymbol || "UNKNOWN",
        side: isBuy ? "BUY" : "SELL",
        quantity: quantity,
        price: 0,
        amount: 0,
        fee: (parseFloat(tx.gasUsed || 0) * parseFloat(tx.gasPrice || 0)) / 1e18,
        raw: tx,
      };
    });

    console.log(`[getEthereumTransactions] Mapped ${mapped.length} transactions`);
    return mapped;
  } catch (err) {
    console.error(`[getEthereumTransactions] Error:`, err.message);
    return [];
  }
};

// ======================================================
// BINANCE TRANSACTIONS - FIXED VERSION
// ======================================================
const BINANCE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

export const getBinanceTransactions = async ({ apiKey, apiSecret }) => {
  console.log(`[getBinanceTransactions] Fetching transactions`);

  if (!apiKey || !apiSecret) {
    console.log(`[getBinanceTransactions] Missing credentials`);
    return [];
  }

  try {
    let allTrades = [];

    for (const symbol of BINANCE_SYMBOLS) {
      const timestamp = Date.now();
      const startTime = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago

      const queryString = `symbol=${symbol}&timestamp=${timestamp}&startTime=${startTime}&limit=1000`;
      const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
      const url = `${BINANCE_BASE_URL}/api/v3/myTrades?${queryString}&signature=${signature}`;

      const response = await fetch(url, {
        headers: { "X-MBX-APIKEY": apiKey },
      });

      if (!response.ok) {
        console.log(`[getBinanceTransactions] HTTP ${response.status} for ${symbol}`);
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data)) continue;

      console.log(`[getBinanceTransactions] Found ${data.length} trades for ${symbol}`);

      const mapped = data.map((tx) => ({
        account: "binance",
        external_id: `${symbol}_${tx.id}`,
        transaction_date: new Date(tx.time),
        entity: tx.symbol,
        side: tx.isBuyer ? "BUY" : "SELL",
        quantity: parseFloat(tx.qty),
        price: parseFloat(tx.price),
        amount: parseFloat(tx.qty) * parseFloat(tx.price),
        fee: parseFloat(tx.commission || 0),
        raw: tx,
      }));

      allTrades.push(...mapped);
    }

    console.log(`[getBinanceTransactions] Total trades: ${allTrades.length}`);
    return allTrades;
  } catch (err) {
    console.error(`[getBinanceTransactions] Error:`, err.message);
    return [];
  }
};

// ======================================================
// KUCOIN TRANSACTIONS - FIXED VERSION
// ======================================================
export const getKuCoinTransactions = async ({ apiKey, apiSecret, passphrase }) => {
  console.log(`[getKuCoinTransactions] Fetching transactions`);

  if (!apiKey || !apiSecret || !passphrase) {
    console.log(`[getKuCoinTransactions] Missing credentials`);
    return [];
  }

  try {
    const endpoint = "/api/v1/fills";
    const timestamp = Date.now().toString();
    const startAt = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const query = `?startAt=${startAt}`;

    const prehash = timestamp + "GET" + endpoint + query;
    const signature = crypto.createHmac("sha256", apiSecret).update(prehash).digest("base64");
    const encryptedPassphrase = crypto.createHmac("sha256", apiSecret).update(passphrase).digest("base64");

    const response = await fetch(`${KUCOIN_BASE_URL}${endpoint}${query}`, {
      headers: {
        "KC-API-KEY": apiKey,
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": encryptedPassphrase,
        "KC-API-KEY-VERSION": "2",
      },
    });

    if (!response.ok) {
      console.log(`[getKuCoinTransactions] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data?.data?.items) {
      console.log(`[getKuCoinTransactions] No transactions found`);
      return [];
    }

    console.log(`[getKuCoinTransactions] Found ${data.data.items.length} transactions`);

    const mapped = data.data.items.map((tx) => ({
      account: "kucoin",
      external_id: tx.tradeId,
      transaction_date: new Date(tx.createdAt),
      entity: tx.symbol,
      side: tx.side?.toUpperCase(),
      quantity: parseFloat(tx.size),
      price: parseFloat(tx.price),
      amount: parseFloat(tx.size) * parseFloat(tx.price),
      fee: parseFloat(tx.fee || 0),
      raw: tx,
    }));

    return mapped;
  } catch (err) {
    console.error(`[getKuCoinTransactions] Error:`, err.message);
    return [];
  }
};

// ======================================================
// COINBASE TRANSACTIONS - FIXED VERSION
// ======================================================
export const getCoinbaseTransactions = async ({ apiKey, apiSecret, passphrase }) => {
  console.log(`[getCoinbaseTransactions] Fetching transactions`);

  if (!apiKey || !apiSecret || !passphrase) {
    console.log(`[getCoinbaseTransactions] Missing credentials`);
    return [];
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const requestPath = "/fills";
    const body = "";
    const message = timestamp + method + requestPath + body;
    const decodedSecret = Buffer.from(apiSecret, "base64");
    const signature = crypto.createHmac("sha256", decodedSecret).update(message).digest("base64");

    const response = await fetch(`${COINBASE_BASE_URL}${requestPath}`, {
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "CB-ACCESS-PASSPHRASE": passphrase,
      },
    });

    if (!response.ok) {
      console.log(`[getCoinbaseTransactions] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.log(`[getCoinbaseTransactions] Invalid response`);
      return [];
    }

    console.log(`[getCoinbaseTransactions] Found ${data.length} transactions`);

    const mapped = data.map((tx) => ({
      account: "coinbase",
      external_id: tx.trade_id?.toString() || `${Date.now()}_${Math.random()}`,
      transaction_date: new Date(tx.created_at),
      entity: tx.product_id,
      side: tx.side?.toUpperCase(),
      quantity: parseFloat(tx.size),
      price: parseFloat(tx.price),
      amount: parseFloat(tx.size) * parseFloat(tx.price),
      fee: parseFloat(tx.fee || 0),
      raw: tx,
    }));

    return mapped;
  } catch (err) {
    console.error(`[getCoinbaseTransactions] Error:`, err.message);
    return [];
  }
};

// ======================================================
// MAIN FETCH FUNCTION - FIXED VERSION
// ======================================================
export const getAllTransactionsFromAPIs = async (creds) => {
  console.log(`[getAllTransactionsFromAPIs] Fetching from all available platforms`);

  const promises = [];

  // Only add promises for credentials that exist
  if (creds.ethAddress && creds.etherscanApiKey) {
    console.log('Adding Ethereum transactions fetch');
    promises.push(getEthereumTransactions(creds.ethAddress, creds.etherscanApiKey));
  } else {
    promises.push(Promise.resolve([]));
  }

  if (creds.binance?.apiKey && creds.binance?.apiSecret) {
    console.log('Adding Binance transactions fetch');
    promises.push(getBinanceTransactions(creds.binance));
  } else {
    promises.push(Promise.resolve([]));
  }

  if (creds.kucoin?.apiKey && creds.kucoin?.apiSecret && creds.kucoin?.passphrase) {
    console.log('Adding KuCoin transactions fetch');
    promises.push(getKuCoinTransactions(creds.kucoin));
  } else {
    promises.push(Promise.resolve([]));
  }

  if (creds.coinbase?.apiKey && creds.coinbase?.apiSecret && creds.coinbase?.passphrase) {
    console.log('Adding Coinbase transactions fetch');
    promises.push(getCoinbaseTransactions(creds.coinbase));
  } else {
    promises.push(Promise.resolve([]));
  }

  const results = await Promise.all(promises);
  const allTransactions = results.flat();

  console.log(`[getAllTransactionsFromAPIs] Total transactions: ${allTransactions.length}`);
  return allTransactions;
};

// ======================================================
// INITIAL FETCH CONTROLLER - FIXED VERSION
// ======================================================
export const initialFetchAndSaveTransactions = async (req, res) => {
  const startTime = Date.now();
  console.log(`[initialFetchAndSaveTransactions] Request started`);

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log(`[initialFetchAndSaveTransactions] Processing for user: ${userId}`);

    // Step 1: Get credentials
    const creds = await getUserCredentialsFromDB(userId);

    // Step 2: Fetch transactions from APIs
    const transactions = await getAllTransactionsFromAPIs(creds);

    // Step 3: Save to database
    const saved = await saveTransactionsToDB(userId, transactions, true);

    const duration = Date.now() - startTime;
    console.log(`[initialFetchAndSaveTransactions] Complete - Fetched: ${transactions.length}, Saved: ${saved}, Duration: ${duration}ms`);

    return res.status(200).json({
      success: true,
      fetched: transactions.length,
      saved: saved,
      duration_ms: duration
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[initialFetchAndSaveTransactions] Error:`, err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
      duration_ms: duration
    });
  }
};

// ======================================================
// DAILY SYNC CONTROLLER - FIXED VERSION
// ======================================================
export const dailyTransactionSync = async (req, res) => {
  const startTime = Date.now();
  console.log(`[dailyTransactionSync] Sync started`);

  try {
    // Get all users with accounts
    const { data: users, error } = await supabase
      .from("accounts")
      .select("*");

    if (error) {
      console.error(`[dailyTransactionSync] Failed to fetch users:`, error);
      throw error;
    }

    console.log(`[dailyTransactionSync] Found ${users?.length || 0} users`);

    let totalSaved = 0;
    let totalFetched = 0;
    const userResults = [];

    for (let i = 0; i < (users?.length || 0); i++) {
      const user = users[i];
      console.log(`[dailyTransactionSync] Processing user ${i + 1}/${users.length}: ${user.user_id}`);

      const creds = {
        ethAddress: user.eth_address,
        etherscanApiKey: user.etherscan_api_key,
        binance: {
          apiKey: user.binance_api_key,
          apiSecret: user.binance_api_secret,
        },
        kucoin: {
          apiKey: user.kucoin_api_key,
          apiSecret: user.kucoin_api_secret,
          passphrase: user.kucoin_passphrase,
        },
        coinbase: {
          apiKey: user.coinbase_api_key,
          apiSecret: user.coinbase_api_secret,
          passphrase: user.coinbase_passphrase,
        },
      };

      const transactions = await getAllTransactionsFromAPIs(creds);
      totalFetched += transactions.length;

      const saved = await saveTransactionsToDB(user.user_id, transactions, false);
      totalSaved += saved;

      userResults.push({
        user_id: user.user_id,
        fetched: transactions.length,
        saved: saved,
      });
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[dailyTransactionSync] Complete - Users: ${users?.length || 0}, Fetched: ${totalFetched}, Saved: ${totalSaved}, Duration: ${totalDuration}ms`);

    return res.status(200).json({
      success: true,
      totalFetched,
      totalSaved,
      totalDurationMs: totalDuration,
      usersProcessed: users?.length || 0,
      userResults: userResults
    });

  } catch (err) {
    const totalDuration = Date.now() - startTime;
    console.error(`[dailyTransactionSync] Error:`, err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
      durationMs: totalDuration
    });
  }
};