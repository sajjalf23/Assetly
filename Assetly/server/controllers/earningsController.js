import supabase from '../config/supabaseClient.js';

export const getEarnings = async (req, res) => {
    try {

        const userId = req.user.id;

        const { data, error } = await supabase
            .from("monthly_account_snapshots")
            .select(`
                snapshot_month,
                crypto_balance,
                stocks_balance,
                forex_balance,
                total_balance
            `)
            .eq("user_id", userId)
            .order("snapshot_month", { ascending: true });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        return res.status(200).json({
            success: true,
            snapshots: data
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};