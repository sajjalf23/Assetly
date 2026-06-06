import supabase from '../config/supabaseClient.js';

export const getUserTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`[getUserTransactionHistory] Fetching transactions for user ${userId}`);
        
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false });

        if (error) throw error;

        const summary = {
            total: transactions?.length || 0,
            platforms: transactions ? [...new Set(transactions.map(t => t.account))] : [],
            uniqueAssets: transactions ? new Set(transactions.map(t => t.entity)).size : 0
        };

        console.log(`[getUserTransactionHistory] Found ${transactions?.length || 0} transactions`);

        res.status(200).json({
            success: true,
            total: transactions?.length || 0,
            transactions: transactions || [],
            summary
        });
    } catch (err) {
        console.error("Error fetching transactions from DB:", err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};

export const getTransactionsByAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { account } = req.params;
        
        console.log(`[getTransactionsByAccount] Fetching ${account} transactions for user ${userId}`);
        
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('account', account)
            .order('transaction_date', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            total: transactions?.length || 0,
            transactions: transactions || []
        });
    } catch (err) {
        console.error("Error fetching transactions by account:", err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};