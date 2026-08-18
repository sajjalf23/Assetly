import supabase from '../config/supabaseClient.js';
import XLSX from 'xlsx';

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

export const exportUserTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            format = 'xlsx',
            account
        } = req.query;

        console.log(
            `[exportUserTransactions] User ${userId} - Format: ${format}, Account: ${account || 'all'}`
        );

        // Build query
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false });

        // Optional account filter
        if (account && account !== 'all') {
            query = query.eq('platform', account);
        }

        const {
            data: transactions,
            error
        } = await query;

        if (error) throw error;

        const data = transactions || [];

        // -----------------------------
        // JSON
        // -----------------------------
        if (format === 'json') {

            res.setHeader(
                'Content-Disposition',
                'attachment; filename="assetly-transactions.json"'
            );

            res.setHeader(
                'Content-Type',
                'application/json'
            );

            return res.status(200).send(
                JSON.stringify(data, null, 2)
            );
        }

        // -----------------------------
        // Excel / CSV
        // -----------------------------

        const worksheet = XLSX.utils.json_to_sheet(data);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            'Transactions'
        );

        // -----------------------------
        // CSV
        // -----------------------------
        if (format === 'csv') {

            const csv = XLSX.utils.sheet_to_csv(worksheet);

            res.setHeader(
                'Content-Disposition',
                'attachment; filename="assetly-transactions.csv"'
            );

            res.setHeader(
                'Content-Type',
                'text/csv'
            );

            return res.status(200).send(csv);
        }

        // -----------------------------
        // XLSX
        // -----------------------------
        if (format === 'xlsx') {

            const buffer = XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx'
            });

            res.setHeader(
                'Content-Disposition',
                'attachment; filename="assetly-transactions.xlsx"'
            );

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );

            return res.status(200).send(buffer);
        }

        return res.status(400).json({
            success: false,
            error: 'Unsupported export format'
        });

    } catch (err) {

        console.error(
            'Error exporting transactions:',
            err
        );

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};