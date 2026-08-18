import supabase from '../config/supabaseClient.js';

// Monthly snapshot worker
const runMonthlySnapshot = async () => {
    console.log("Starting monthly account snapshot job...");

    try {
        // 1. Fetch current balances for all accounts
        const { data: accounts, error: fetchError } = await supabase
            .from("accounts")
            .select("user_id, crypto_balance, stocks_balance, forex_balance");

        if (fetchError) throw fetchError;
        if (!accounts || accounts.length === 0) return;

        // 2. Format current month and year (e.g., "Jul 2026")
        const snapshotMonth = new Date().toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        }); // Output format: "Jul 2026"

        // 3. Map balances into snapshot payload
        const snapshotRecords = accounts.map(acc => ({
            user_id: acc.user_id,
            crypto_balance: acc.crypto_balance || 0,
            stocks_balance: acc.stocks_balance || 0,
            forex_balance: acc.forex_balance || 0,
            snapshot_date: snapshotMonth, // Stores "Jul 2026"
        }));

        // 4. Batch upsert/insert into monthly_account_snapshots
        const { error: insertError } = await supabase
            .from("monthly_account_snapshots")
            .upsert(snapshotRecords, { onConflict: "user_id, snapshot_month" });

        if (insertError) throw insertError;

        console.log(`Successfully saved ${snapshotRecords.length} monthly account snapshots for ${snapshotMonth}.`);
    } catch (err) {
        console.error("Failed to execute monthly snapshot job:", err.message);
    }
};

export default runMonthlySnapshot;