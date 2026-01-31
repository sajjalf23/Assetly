import fetch from "node-fetch";
import crypto from "crypto";


const BINANCE_BASE_URL = "https://api.binance.com";

//  Ethereum Wallet 
export const getEthereumPortfolio = async (ethAddress, etherscanApiKey) => {
  if (!ethAddress || !etherscanApiKey) return [];
  const ETHERSCAN_BASE_URL = "https://api.etherscan.io/api";
  const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${ethAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!data.result) return [];
  const assetData = {};
  data.result.forEach(tx => {
    const symbol = tx.tokenSymbol || "UNKNOWN";
    const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || "18"));
    if (!assetData[symbol]) assetData[symbol] = { amount: 0, trades: 0 };
    if (tx.to.toLowerCase() === ethAddress.toLowerCase()) assetData[symbol].amount += amount;
    if (tx.from.toLowerCase() === ethAddress.toLowerCase()) assetData[symbol].amount -= amount;
    assetData[symbol].trades += 1;
  });
  // Clean weird/dust tokens
  const cleanedData = { "Other Tokens": { amount: 0, trades: 0 } };
  Object.entries(assetData).forEach(([asset, { amount, trades }]) => {
    const roundedAmount = parseFloat(amount.toFixed(6));
    const isWeird =
      asset.length > 10 || asset.length <= 2 || /^[0-9]+$/.test(asset);
    const isDust = Math.abs(roundedAmount) < 0.01;
    if (isWeird || isDust) {
      cleanedData["Other Tokens"].amount += roundedAmount;
      cleanedData["Other Tokens"].trades += trades;
    } else {
      cleanedData[asset] = { amount: roundedAmount, trades };
    }
  });
  return Object.entries(cleanedData).map(([asset, { amount, trades }]) => ({
    asset,
    amount,
    tradeCount: trades,
    source: "ethereum",
  }));
};




//  Binance 
export const getBinancePortfolio = async ({ apiKey, apiSecret }) => {
  if (!apiKey || !apiSecret) return [];
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
  const url = `${BINANCE_BASE_URL}/api/v3/account?${queryString}&signature=${signature}`;
  const response = await fetch(url, { headers: { "X-MBX-APIKEY": apiKey } });
  if (!response.ok) return [];
  const data = await response.json();
  return data.balances
    .map(b => ({ asset: b.asset, amount: parseFloat(b.free) + parseFloat(b.locked), source: "binance" }))
    .filter(b => b.amount > 0)
    .map(b => ({ ...b, amount: parseFloat(b.amount.toFixed(8)) }));
};





// KuCoin 
export const getKuCoinPortfolio = async ({ apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) return [];
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
    .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "kucoin" }))
    .filter(a => a.amount > 0)
    .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }));
};




//  Coinbase 
export const getCoinbasePortfolio = async ({ apiKey, apiSecret, passphrase }) => {
  if (!apiKey || !apiSecret || !passphrase) return [];
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
    .map(a => ({ asset: a.currency, amount: parseFloat(a.balance), source: "coinbase" }))
    .filter(a => a.amount > 0)
    .map(a => ({ ...a, amount: parseFloat(a.amount.toFixed(8)) }));
};




//  Unified Controller 
export const getUserCryptoPortfolio = async (req, res) => {
  try {
    const userId = req.user.id; // from auth token/session
    const userCreds = await getUserCredentialsFromDB(userId);
    const [eth, bin, kc, cb] = await Promise.all([
      getEthereumPortfolio(userCreds.ethAddress, userCreds.etherscanApiKey),
      getBinancePortfolio(userCreds.binance),
      getKuCoinPortfolio(userCreds.kucoin),
      getCoinbasePortfolio(userCreds.coinbase),
    ]);
    //  merge duplicates
    const combined = [...eth, ...bin, ...kc, ...cb];
    const mergedPortfolio = combined.reduce((acc, cur) => {
      const existing = acc.find(a => a.asset === cur.asset);
      if (existing) existing.amount += cur.amount;
      else acc.push({ ...cur });
      return acc;
    }, []);
    res.status(200).json({ portfolio: mergedPortfolio });
  } catch (err) {
    console.error("Unified Portfolio Error:", err);
    res.status(500).json({ error: err.message });
  }
};
