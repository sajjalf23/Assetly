import fetch from "node-fetch";
import supabase from '../config/supabaseClient.js';
import { getPaperInvestToken } from "../services/getPaperInvestToken.js";

const PAPER_INVEST_BASE_URL = "https://api.paperinvest.io";

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

// Helper function to check if stocks data should be refreshed
const shouldRefreshStocks = async (userId) => {
    const { data } = await supabase
        .from("accounts")
        .select("stocks_last_sync")
        .eq("user_id", userId)
        .single();

    if (!data?.stocks_last_sync) return true;

    const diff =
        Date.now() -
        new Date(data.stocks_last_sync).getTime();

    return diff > 15 * 60 * 1000;
};

// Helper function to update the last sync time for stocks
const updateStockSyncTime = async (userId) => {
    await supabase
        .from("accounts")
        .update({
            stocks_last_sync: new Date().toISOString()
        })
        .eq("user_id", userId);
};

// Helper function to upsert stock transactions into the database
const upsertStockTransactions = async (userId, portfolio) => {

    const rows = portfolio.map(asset => ({

        user_id: userId,

        platform: asset.source,

        external_id: `${userId}_${asset.source}_${asset.asset}`,

        transaction_date: new Date().toISOString(),

        asset_type: "stocks",

        entity: asset.asset,

        side: "HOLDING",

        quantity: asset.amount,

        price: null,

        amount: asset.amount,

        fee: 0,

        raw: asset

    }));


    await supabase
        .from("transactions")
        .upsert(rows, {
            onConflict: "external_id"
        });

}

// Helper function to get stocks portfolio from database
const getStocksPortfolioFromDB = async (userId) => {
    const { data, error } = await supabase
        .from("transactions")
        .select(`entity, quantity, platform`)
        .eq("user_id", userId)
        .in("platform", [
            "stocks",
            "PaperInvest"
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
                tradeCount: 0,
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

// Get last 6 months stocks snapshots
const getStocksSnapshots = async (userId) => {
    const { data, error } = await supabase
        .from("monthly_account_snapshots")
        .select(`
      snapshot_month,
      stocks_balance
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
        value: Number(item.stocks_balance) || 0,
    }));
};

// PaperInvest
export const getPaperInvestPortfolio = async ({ userId, apiKey, accountId }) => {
    if (!apiKey || !accountId) {
        return {
            connected: false,
            portfolio: [],
        }
    }

    try {
        const token = await getPaperInvestToken(apiKey);
        if (!token) {
            await setUserApiStatus(userId, 'paperinvest_api_status', false);
            return {
                connected: false,
                portfolio: [],
            }
        }

        const url = `${PAPER_INVEST_BASE_URL}/v1/orders/account/${accountId}?page=1&limit=50`;
        console.log('Fetching PaperInvest portfolio from:', url);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            await setUserApiStatus(userId, 'paperinvest_api_status', false);
            return {
                connected: false,
                portfolio: []
            };
        }

        const data = await response.json();
        console.log("PAPERINVEST RAW STOCKS:", data);

        if (!Array.isArray(data.orders)) {
            console.log('PaperInvest returned no orders array:', data.message || 'Unknown error');
            await setUserApiStatus(userId, 'paperinvest_api_status', false);
            return {
                connected: false,
                portfolio: []
            };
        }
        await setUserApiStatus(userId, 'paperinvest_api_status', true);

        return {
            connected: true,
            portfolio: data.orders
                .map(order => ({
                    asset: order.symbol,
                    amount: parseFloat(Number(order.quantity).toFixed(8)),
                    tradeCount: 1,
                    source: "PaperInvest",
                }))
                .filter(o => o.amount > 0)
        };

    } catch (error) {
        console.error("PaperInvest portfolio error:", error);

        await setUserApiStatus(userId, 'paperinvest_api_status', false);

        return {
            connected: false,
            portfolio: []
        };
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
        const refreshNeeded = await shouldRefreshStocks(userId);
        const userCreds = await getUserCredentialsFromDB(userId);

        let paperinvest = { connected: false, portfolio: [] };

        if (refreshNeeded) {
            // Build promises object only for credentials that exist
            const promises = {
                paperinvest: null,
            };

            // Check each credential and add to promises if valid
            if (userCreds.paperinvest?.apiKey && userCreds.paperinvest?.accountId) {
                console.log('Adding PaperInvest portfolio fetch');
                promises.paperinvest = getPaperInvestPortfolio({ userId, ...userCreds.paperinvest });
            } else {
                console.log('Skipping PaperInvest - missing credentials');
            }

            // Wait for all promises to resolve (some may be empty arrays)
            [paperinvest] = await Promise.all([
                promises.paperinvest ?? Promise.resolve({
                    connected: false,
                    portfolio: []
                })
            ]);

            // Flatten all results into a single array
            const allPortfolios = [paperinvest].flatMap(
                result => result.portfolio
            );

            console.log(`Total assets before merging: ${allPortfolios.length}`);


            await upsertStockTransactions(userId, allPortfolios);
            await updateStockSyncTime(userId);
        }
        const portfolioFromDB = await getStocksPortfolioFromDB(userId);

        // Sort by amount (descending)
        portfolioFromDB.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

        const totalStockBalance = portfolioFromDB.reduce(
            (sum, asset) => sum + asset.amount,
            0
        );

        const { error: updateError } = await supabase
            .from("accounts")
            .update({
                stock_balance: totalStockBalance,
            })
            .eq("user_id", userId);

        if (updateError) {
            console.error(
                "Error updating stock balance:",
                updateError
            );
        }

        console.log(`Final portfolio has ${portfolioFromDB.length} unique assets`);
        const stocksSnapshots = await getStocksSnapshots(userId);

        res.status(200).json({
            success: true,
            portfolio: portfolioFromDB,
            stocksSnapshots,
            summary: {
                apiStatus: {
                    paperinvest: paperinvest?.connected || false
                },

                totalUniqueAssets: portfolioFromDB.length,

                sources: {
                    paperinvest: paperinvest?.portfolio?.length || 0
                }
            }
        });

    } catch (err) {
        console.error("Unified Portfolio Error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};