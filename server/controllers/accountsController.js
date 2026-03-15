import supabase from '../config/supabaseClient.js'

export const getAccounts = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        // Get account with all exchange fields
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw error;
        }

        res.status(200).json({
            success: true,
            account: data || {}
        });

    } catch (err) {
        console.error('Error fetching account:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to fetch account data' 
        });
    }
}

export const saveAccount = async (req, res) => {
    try {
        const user = req.user;
        const accountData = req.body;

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        // Check if user already has an account
        const { data: existingAccount, error: fetchError } = await supabase
            .from('accounts')
            .select('id')
            .eq('user_id', user.id)
            .single();

        let result;
        
        if (existingAccount) {
            // Update existing account
            const { data, error } = await supabase
                .from('accounts')
                .update(accountData)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Create new account
            const accountWithUser = {
                ...accountData,
                user_id: user.id
            };

            const { data, error } = await supabase
                .from('accounts')
                .insert([accountWithUser])
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.status(200).json({
            success: true,
            message: 'Account saved successfully',
            account: result
        });

    } catch (err) {
        console.error('Error saving account:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to save account' 
        });
    }
}

export const updateAccount = async (req, res) => {
    try {
        const user = req.user;
        const { accountId } = req.params;
        const accountData = req.body;

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        // Verify the account belongs to the user
        const { data: existingAccount, error: fetchError } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existingAccount) {
            return res.status(404).json({ 
                success: false, 
                message: "Account not found" 
            });
        }

        const { data, error } = await supabase
            .from('accounts')
            .update(accountData)
            .eq('id', accountId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Account updated successfully',
            account: data
        });

    } catch (err) {
        console.error('Error updating account:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to update account' 
        });
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const user = req.user;
        const { accountId } = req.params;

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        // Verify the account belongs to the user
        const { data: existingAccount, error: fetchError } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existingAccount) {
            return res.status(404).json({ 
                success: false, 
                message: "Account not found" 
            });
        }

        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to delete account' 
        });
    }
}

export const deleteExchangeData = async (req, res) => {
    try {
        const user = req.user;
        const { exchangeType } = req.body; // Changed from fields to exchangeType

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }

        if (!exchangeType) {
            return res.status(400).json({ 
                success: false, 
                message: "Exchange type is required" 
            });
        }

        // Define which fields belong to which exchange
        const exchangeFields = {
            stock: ['stock_api', 'stock_account_id'],
            forex: ['forex_api', 'forex_account_id'],
            wallet: ['eth_address', 'etherscan_api_key'],
            binance: ['binance_api_key', 'binance_api_secret'],
            kucoin: ['kucoin_api_key', 'kucoin_api_secret', 'kucoin_passphrase'],
            coinbase: ['coinbase_api_key', 'coinbase_api_secret', 'coinbase_passphrase']
        };

        const fieldsToClear = exchangeFields[exchangeType];
        
        if (!fieldsToClear) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid exchange type" 
            });
        }

        // Build update object to nullify exchange fields
        const updateData = {};
        fieldsToClear.forEach(field => {
            updateData[field] = null;
        });

        const { error } = await supabase
            .from('accounts')
            .update(updateData)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: `${exchangeType} data deleted successfully`
        });

    } catch (err) {
        console.error('Error deleting exchange data:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Failed to delete exchange data' 
        });
    }
}