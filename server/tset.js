import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const ETHERSCAN_BASE_URL = "https://api.etherscan.io/v2/api";

const getCryptoWalletTrades = async () => {
  try {
    const wallet = process.env.WALLET_CRYPTO_KEY;

    const response = await fetch(
      `${ETHERSCAN_BASE_URL}?chainid=1&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`
    );

    const data = await response.json();

    if (data.status === "0") {
      throw new Error(data.result);
    }

    console.log("Transaction Data:", data);
    return data;

  } catch (error) {
    console.error("Crypto Controller Error:", error.message);
  }
};

// Run test
getCryptoWalletTrades();
