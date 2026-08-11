import supabase from '../config/supabaseClient.js';

export const getUserTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get page and limit from query params
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        console.log(
            `[getUserTransactionHistory] User ${userId} - Page ${page}, rows ${from}-${to}`
        );

        const {
            data: transactions,
            error,
            count
        } = await supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false })
            .range(from, to);

        if (error) throw error;

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true,
            transactions: transactions || [],
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
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
            .eq('platform', account)
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