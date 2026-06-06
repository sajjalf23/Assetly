import fetch from "node-fetch";
import supabase from '../config/supabaseClient.js';
import { getPaperInvestToken } from "../services/getPaperInvestToken.js";

const PAPER_INVEST_BASE_URL = "https://api.paperinvest.io";

// Helper function to get user credentials from database
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
      paperinvest: { apiKey: null, accountId: null },
    };
  }

  const account = data[0];
  console.log('Found account record for user:', userId);

  return {
    paperinvest: {
      apiKey: account?.stock_api || null,
      accountId: account?.stock_account_id || null,
    },
  };
};

// PaperInvest
export const getPaperInvestPortfolio = async ({ apiKey, accountId }) => {
  if (!apiKey || !accountId) return [];

  try {
    const token = await getPaperInvestToken(apiKey);
    if (!token) return [];

    const url = `${PAPER_INVEST_BASE_URL}/v1/orders/account/${accountId}?page=1&limit=50`;
    console.log('Fetching PaperInvest portfolio from:', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    console.log("PAPERINVEST RAW STOCKS:", data);

    if (!Array.isArray(data.orders)) {
      console.log('PaperInvest returned no orders array:', data.message || 'Unknown error');
      return [];
    }

    return data.orders.map(order => ({
      asset: order.symbol,
      amount: parseFloat(Number(order.quantity).toFixed(8)),
      tradeCount: 1,
      source: "paperinvest",
    })).filter(o => o.amount > 0);

  } catch (error) {
    console.error('PaperInvest portfolio error:', error);
    return [];
  }
};

// Unified Controller
export const stocksController = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = user.id;
    const userCreds = await getUserCredentialsFromDB(userId);

    const promises = [];

    if (userCreds.paperinvest?.apiKey && userCreds.paperinvest?.accountId) {
      console.log('Adding PaperInvest portfolio fetch');
      promises.push(getPaperInvestPortfolio(userCreds.paperinvest));
    } else {
      console.log('Skipping PaperInvest - missing credentials');
      promises.push(Promise.resolve([]));
    }

    const results = await Promise.all(promises);
    const allPortfolios = results.flat();

    console.log(`Total stock assets before merging: ${allPortfolios.length}`);

    const mergedPortfolio = allPortfolios.reduce((acc, cur) => {
      const existing = acc.find(a => a.asset === cur.asset);
      if (existing) {
        existing.amount += cur.amount;
        existing.tradeCount = (existing.tradeCount || 0) + (cur.tradeCount || 0);
        existing.sources = existing.sources || [existing.source];
        if (!existing.sources.includes(cur.source)) {
          existing.sources.push(cur.source);
        }
        existing.source = existing.sources.join(', ');
      } else {
        acc.push({ ...cur, sources: [cur.source] });
      }
      return acc;
    }, []);

    mergedPortfolio.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    console.log(`Final stocks portfolio has ${mergedPortfolio.length} unique assets`);

    res.status(200).json({
      success: true,
      portfolio: mergedPortfolio,
      summary: {
        totalUniqueAssets: mergedPortfolio.length,
        sources: {
          paperinvest: results[0]?.length || 0,
        },
      },
    });

  } catch (err) {
    console.error("Stocks Portfolio Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};