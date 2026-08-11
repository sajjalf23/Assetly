import axios from "axios";
import supabase from "../config/supabaseClient.js";

export const homeController = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch user account data from Supabase
        const { data: account, error } = await supabase
            .from("accounts")
            .select(`
                crypto_balance,
                stocks_balance,
                forex_balance,

                binance_api_status,
                eth_api_status,
                kucoin_api_status,
                coinbase_api_status,
                paperinvest_api_status,
                oanda_api_status
            `)
            .eq("user_id", userId)
            .single();

        if (error) throw error;

        // Fetch monthly balance history
       console.log("User ID:", userId);

const { data: snapshots, error: snapshotError } = await supabase
    .from("monthly_account_snapshots")
    .select("*")
    .eq("user_id", userId);

console.log("Snapshot error:", snapshotError);
console.log("Snapshots:", snapshots);

        if (snapshotError) throw snapshotError;

        const history = snapshots.map(item => ({
            month: new Date(item.snapshot_month).toLocaleString("en-US", {
                month: "short"
            }),
            balance: Number(item.total_balance)
        }));

        let monthlyChange = null;

        if (history.length >= 2) {
            const previous = history[history.length - 2].balance;
            const current = history[history.length - 1].balance;

            if (previous > 0) {
                monthlyChange = Number(
                    (((current - previous) / previous) * 100).toFixed(2)
                );
            }
        }



        // 2. Fetch CoinGecko market data
        const cgResponse = await axios.get(
            "https://api.coingecko.com/api/v3/coins/markets",
            {
                params: {
                    vs_currency: "usd",
                    order: "market_cap_desc",
                    per_page: 100,
                    price_change_percentage: "24h,7d"
                }
            }
        )

        const top_performer_24h =
            cgResponse.data.length === 0
                ? null
                : cgResponse.data.reduce((max, current) =>
                    (current.price_change_percentage_24h ?? -Infinity) >
                        (max.price_change_percentage_24h ?? -Infinity)
                        ? current
                        : max
                );

        // balances
        const crypto = account.crypto_balance || 0;
        const stocks = account.stocks_balance || 0;
        const forex = account.forex_balance || 0;


        // statuses
        const statuses = [
            account.binance_api_status,
            account.kucoin_api_status,
            account.coinbase_api_status,
            account.paperinvest_api_status,
            account.oanda_api_status,
        ];

        // only APIs that user has actually connected
        const connected = statuses.filter(s => s !== null);

        const active = connected.filter(Boolean).length;
        const inactive = connected.length - active;

        console.log("User ID:", userId);
        console.log("Account:", account);
        console.log("Snapshots:", snapshots);
        console.log("History:", history);

        res.json({
            success: true,

            balances: {
                crypto,
                stocks,
                forex,
                total: crypto + stocks + forex,
            },

            integrations: {
                connected: connected.length,
                active,
                inactive,
                allActive: inactive === 0 && connected.length > 0,
            },

            history,

            monthlyChange,

            top_performer_24h: top_performer_24h ? {
                name: top_performer_24h.name,
                symbol: top_performer_24h.symbol.toUpperCase(),
                price_change_percentage_24h: top_performer_24h.price_change_percentage_24h,
            } : null
        });

    } catch (err) {
        console.error("HOME CONTROLLER ERROR");
        console.error(err);
        console.error(err.stack);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};