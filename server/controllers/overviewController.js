import supabase from "../config/supabaseClient.js";

export const overviewController = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch Current account balances
        const { data: account, error: accountError } = await supabase
            .from("accounts")
            .select("crypto_balance, stocks_balance, forex_balance")
            .eq("user_id", userId)
            .single();

        if (accountError && accountError.code !== "PGRST116") {
            throw accountError;
        }

        const crypto = account?.crypto_balance || 0;
        const stocks = account?.stocks_balance || 0;
        const forex = account?.forex_balance || 0;
        const totalWorth = crypto + stocks + forex;

        // Current real-time portfolio distribution
        const distribution = [
            { name: "Crypto", value: crypto, color: "#2dd4bf" },
            { name: "Stocks", value: stocks, color: "#3b82f6" },
            { name: "Forex", value: forex, color: "#fbbf24" }
        ];

        // Fetch monthly account snapshots
        const { data: snapshots, error: snapshotError } = await supabase
            .from("monthly_account_snapshots")
            .select("*")
            .eq("user_id", userId)
            .order("snapshot_month", { ascending: true });

        if (snapshotError) throw snapshotError;

        // Map line graph data
        const graph = (snapshots || []).map((item) => ({
            month: item.snapshot_month,
            Crypto: Number(item.crypto_balance || 0),
            Stocks: Number(item.stocks_balance || 0),
            Forex: Number(item.forex_balance || 0),
            Total: Number(item.total_balance || 0)
        }));

        // Calculate average monthly total worth
        const totalSum = graph.reduce((sum, item) => sum + item.Total, 0);
        const average = graph.length > 0 ? totalSum / graph.length : totalWorth;

        // Best performing asset overall based on current holdings
        const bestAssetObj = distribution.reduce((a, b) => (a.value > b.value ? a : b), distribution[0]);

        // Best month calculated from snapshots
        const bestMonthObj =
            graph.length > 0
                ? graph.reduce((max, item) => (item.Total > max.Total ? item : max), graph[0])
                : null;

        // Previous month's snapshot balance
        let previousMonthTotal = 0;

        if (snapshots && snapshots.length > 0) {
            previousMonthTotal = Number(
                snapshots[snapshots.length - 1].total_balance || 0
            );
        }

        res.json({
            success: true,
            balances: { crypto, stocks, forex, total: totalWorth },
            distribution,
            graph,
            stats: {
                totalWorth,
                average,
                bestAsset: bestAssetObj ? bestAssetObj.name : "N/A",
                bestMonth: bestMonthObj ? new Date(bestMonthObj.month).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric"
                }) : "N/A",
                bestMonthValue: bestMonthObj ? bestMonthObj.Total : 0,
                previousMonthTotal
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};