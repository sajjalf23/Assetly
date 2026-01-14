import fetch from "node-fetch";

const OANDA_BASE_URL = "https://api-fxpractice.oanda.com";

export const getForexTrades = async (req, res) => {
  try {
    const response = await fetch(
      `${OANDA_BASE_URL}/v3/accounts/${process.env.OANDA_ACCOUNT_ID}/trades`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.OANDA_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OANDA Error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Forex Controller Error:", error.message);
    res.status(500).json({
      error: "Failed to fetch forex trades",
      details: error.message,
    });
  }
};
