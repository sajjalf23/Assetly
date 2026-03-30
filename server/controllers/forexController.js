import fetch from "node-fetch";
import supabase from '../config/supabaseClient.js';

const OANDA_BASE_URL = "https://api-fxpractice.oanda.com";

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
      oanda: { apiKey: null, accountId: null },
    };
  }

  const account = data[0];
  console.log('Found account record for user:', userId);

  return {
    oanda: {
      apiKey: account?.forex_api || null,
      accountId: account?.forex_account_id || null,
    },
  };
};

// OANDA
export const getOANDAPortfolio = async ({ apiKey, accountId }) => {
  if (!apiKey || !accountId) return [];

  try {
    const response = await fetch(
      `${OANDA_BASE_URL}/v3/accounts/${accountId}/trades`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    console.log("OANDA RAW FOREX:", data);

    if (!Array.isArray(data.trades)) {
      console.log('OANDA returned no trades array:', data.message || 'Unknown error');
      return [];
    }

    return data.trades.map(trade => ({
      asset: trade.instrument,
      amount: parseFloat(trade.currentUnits),
      tradeCount: 1,
      source: "oanda",
    })).filter(t => t.amount !== 0);

  } catch (error) {
    console.error('OANDA portfolio error:', error);
    return [];
  }
};

// Unified Controller
export const forexController = async (req, res) => {
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

    if (userCreds.oanda?.apiKey && userCreds.oanda?.accountId) {
      console.log('Adding OANDA portfolio fetch');
      promises.push(getOANDAPortfolio(userCreds.oanda));
    } else {
      console.log('Skipping OANDA - missing credentials');
      promises.push(Promise.resolve([]));
    }

    const results = await Promise.all(promises);
    const allPortfolios = results.flat();

    console.log(`Total forex assets before merging: ${allPortfolios.length}`);

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

    console.log(`Final forex portfolio has ${mergedPortfolio.length} unique assets`);

    res.status(200).json({
      success: true,
      portfolio: mergedPortfolio,
      summary: {
        totalUniqueAssets: mergedPortfolio.length,
        sources: {
          oanda: results[0]?.length || 0,
        },
      },
    });

  } catch (err) {
    console.error("Forex Portfolio Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};