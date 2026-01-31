import fetch from "node-fetch";
import { getPaperInvestToken } from "../services/getPaperInvestToken.js";

export const stocksController = async (req, res) => {
  try {
    const token = await getPaperInvestToken();

    const url = `${process.env.PAPER_INVEST_BASE_URL}/v1/orders/account/${process.env.PAPER_INVEST_ACCOUNT_ID}?page=1&limit=50`;

    console.log("Fetching:", url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    console.log("ORDERS RAW:", data);

    res.json(data);
  } catch (err) {
    console.error("Orders Controller Error:", err.message);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};
