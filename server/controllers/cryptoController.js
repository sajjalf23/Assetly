import fetch from "node-fetch";

export const getCryptoWalletTrades = async (req, res) => {
  try {
    const wallet = process.env.WALLET_CRYPTO_KEY;
    const apiKey = process.env.ETHERSCAN_API_KEY;

    if (!wallet || !apiKey) {
      return res.status(400).json({ error: "Wallet or API key missing" });
    }

    const ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api";
    const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${wallet}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&chainid=1&apikey=${apiKey}`;
    console.log("Fetching Etherscan URL:", url);

    const response = await fetch(url);
    const data = await response.json();

    if (!data.result) {
      return res.status(500).json({ error: "No transaction data returned" });
    }

    // Aggregate amounts and trade counts per token
    const assetData = {};
    data.result.forEach(tx => {
      const symbol = tx.tokenSymbol || "UNKNOWN";
      const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || "18"));

      if (!assetData[symbol]) assetData[symbol] = { amount: 0, trades: 0 };

      if (tx.to.toLowerCase() === wallet.toLowerCase()) assetData[symbol].amount += amount;
      if (tx.from.toLowerCase() === wallet.toLowerCase()) assetData[symbol].amount -= amount;

      assetData[symbol].trades += 1;
    });

    // Filter & group weird tokens / dust
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

    // Convert to array for response
    const portfolio = Object.entries(cleanedData).map(([asset, { amount, trades }]) => ({
      asset,
      amount,
      tradeCount: trades
    }));

    res.status(200).json({ portfolio });
  } catch (err) {
    console.error("Crypto Portfolio Error:", err);
    res.status(500).json({ error: err.message });
  }
};
