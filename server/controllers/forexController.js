import fetch from "node-fetch";
import supabase from '../config/supabaseClient.js';
import axios from "axios"

const OANDA_BASE_URL = "https://api-fxpractice.oanda.com";

// Helper function to set the api status of the user
const setUserApiStatus = async (userId, apiName, status) => {
  const { error } = await supabase
    .from("accounts")
    .update({ [apiName]: status })
    .eq("user_id", userId);

  if (error) {
    console.error(
      `Failed to update ${apiName}:`,
      error
    );
  }
}

// Helper function to get user credentials from database
const getUserCredentialsFromDB = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  console.log('Fetching credentials for user:', userId);

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
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

// Helper function to check if the forex data should be refreshed
const shouldRefreshForex = async (userId) => {

  const { data } = await supabase
    .from("accounts")
    .select("forex_last_sync")
    .eq("user_id", userId)
    .single();

  if (!data?.forex_last_sync)
    return true;

  const diff =
    Date.now() -
    new Date(data.forex_last_sync).getTime();

  return diff > 15 * 60 * 1000;
}

// Helper function to update the last sync time for forex data
const updateForexSyncTime = async (userId) => {

  await supabase
    .from("accounts")
    .update({

      forex_last_sync:
        new Date().toISOString()

    })
    .eq("user_id", userId);

}

// Helper function to upsert forex transactions into the database
const upsertForexTransactions = async (userId, portfolio) => {
  const rows = portfolio.map(asset => ({
    user_id: userId,

    platform: asset.source,

    external_id: `${userId}_${asset.source}_${asset.asset}`,

    transaction_date: new Date().toISOString(),

    asset_type: "forex",

    entity: asset.asset,

    side: "HOLDING",

    quantity: asset.amount,

    price: null,

    amount: asset.amount,

    fee: 0,

    raw: asset
  }));

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, {
      onConflict: "external_id"
    });

  if (error) {
    console.log(error);
  }
}

// Helper function to get forex portfolio from database
const getForexPortfolioFromDB = async (userId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(`entity, quantity, platform`)
    .eq("user_id", userId)
    .in("platform", [
      "forex",
      "oanda"
    ]);

  if (error) {
    console.log(error);
    return [];
  }

  const merged = {};

  data.forEach(tx => {

    if (!merged[tx.entity]) {
      merged[tx.entity] = {
        asset: tx.entity,
        amount: 0,
        sources: []
      };

    }

    merged[tx.entity].amount += Number(tx.quantity);

    if (!merged[tx.entity].sources.includes(tx.platform)) {
      merged[tx.entity].sources.push(tx.platform);
    }

  });

  return Object.values(merged)
    .sort((a, b) => b.amount - a.amount);
};

export const getForexMarketOverview = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: "pax-gold,tether-gold,kinesis-silver",
        },
      }
    );

    const gold = data.find(c => c.id === "pax-gold") || data.find(c => c.id === "tether-gold");
    const silver = data.find(c => c.id === "kinesis-silver");

    res.json({
      success: true,
      gold: gold?.current_price ?? null,
      silver: silver?.current_price ?? null,
    });
  } catch (err) {
    console.error("Forex market overview error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch market data" });
  }
};

// Get last 6 months forex snapshots
const getForexSnapshots = async (userId) => {
  const { data, error } = await supabase
    .from("monthly_account_snapshots")
    .select(`
      snapshot_month,
      forex_balance
    `)
    .eq("user_id", userId)
    .order("snapshot_month", { ascending: false })
    .limit(6);

  if (error) {
    console.error(error);
    return [];
  }

  // Return oldest -> newest
  return data.reverse().map(item => ({
    month: new Date(item.snapshot_month).toLocaleString("default", {
      month: "short",
    }),
    value: Number(item.forex_balance) || 0,
  }));
};

// OANDA
export const getOANDAPortfolio = async ({ userId, apiKey, accountId }) => {
  if (!apiKey || !accountId) {
    return {
      connected: false,
      portfolio: [],
    };
  }

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

    if (!response.ok) {
      await setUserApiStatus(userId, 'oanda_api_status', false);
      return {
        connected: false,
        portfolio: [],
      };
    }

    const data = await response.json();
    console.log("OANDA RAW FOREX:", data);

    if (!Array.isArray(data.trades)) {
      await setUserApiStatus(userId, 'oanda_api_status', false);
      return {
        connected: false,
        portfolio: [],
      };
    }
    await setUserApiStatus(userId, 'oanda_api_status', true);

    return {
      connected: true,
      portfolio: data.trades
        .map(trade => ({
          asset: trade.instrument,
          amount: parseFloat(trade.currentUnits),
          source: "oanda",
        }))
        .filter(t => t.amount !== 0),
    };

  } catch (error) {
    console.error('OANDA portfolio error:', error);

    await setUserApiStatus(userId, 'oanda_api_status', false);

    return {
      connected: false,
      portfolio: [],
    };
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
    const refreshNeeded = await shouldRefreshForex(userId);
    const userCreds = await getUserCredentialsFromDB(userId);

    let oanda = { connected: false, portfolio: [] };

    if (refreshNeeded) {
      // Build promises object only for credentials that exist
      const promises = {
        oanda: null
      };

      // Check each credential and add to promises if valid
      if (userCreds.oanda?.apiKey && userCreds.oanda?.accountId) {
        console.log('Adding OANDA portfolio fetch');
        promises.oanda = getOANDAPortfolio({ userId, ...userCreds.oanda });
      } else {
        console.log('Skipping OANDA - missing credentials');
      }


      // Wait for all promises to resolve (some may be empty arrays)
      [oanda] = await Promise.all([
        promises.oanda ?? Promise.resolve({
          connected: false,
          portfolio: []
        })
      ]);

      // Flatten all results into a single array
      const allPortfolios = [oanda].flatMap(
        result => result.portfolio
      );

      console.log(`Total assets before merging: ${allPortfolios.length}`);


      await upsertForexTransactions(userId, allPortfolios);
      await updateForexSyncTime(userId);
    }

    const portfolioFromDB = await getForexPortfolioFromDB(userId);

    // Sort by amount (descending)
    portfolioFromDB.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    const totalForexBalance = portfolioFromDB.reduce(
      (sum, asset) => sum + asset.amount,
      0
    );

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        forex_balance: totalForexBalance,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(
        "Error updating forex balance:",
        updateError
      );
    }

    console.log(`Final portfolio has ${portfolioFromDB.length} unique assets`);
    const forexSnapshots = await getForexSnapshots(userId);
    console.log("Snapshots from DB:", forexSnapshots);

    res.status(200).json({
      success: true,
      portfolio: portfolioFromDB,
      forexSnapshots,
      summary: {
        apiStatus: {
          oanda: oanda?.connected || false
        },

        totalUniqueAssets: portfolioFromDB.length,

        sources: {
          oanda: oanda?.portfolio?.length || 0,
        }
      }
    });

  } catch (err) {
    console.error("Forex Portfolio Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};