import supabase from '../config/supabaseClient.js';
import { getAllTransactionsFromAPIs, saveTransactionsToDB } from './fetchAndSaveController.js';

// ======================================================
// HELPER: Delete transactions for a specific platform
// ======================================================
const deletePlatformTransactions = async (userId, platform) => {
    console.log(`[deletePlatformTransactions] Deleting ${platform} transactions for user ${userId}`);

    const { data, error, count } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('account', platform)
        .select('count', { count: 'exact' });

    if (error) {
        console.error(`[deletePlatformTransactions] Error deleting ${platform}:`, error);
        return 0;
    }

    console.log(`[deletePlatformTransactions] Deleted ${count || 0} ${platform} transactions`);
    return count || 0;
};

// ======================================================
// HELPER: Get current credentials from account
// ======================================================
const getCurrentCredentials = async (userId) => {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        ethAddress: data.eth_address,
        etherscanApiKey: data.etherscan_api_key,
        binance: {
            apiKey: data.binance_api_key,
            apiSecret: data.binance_api_secret
        },
        kucoin: {
            apiKey: data.kucoin_api_key,
            apiSecret: data.kucoin_api_secret,
            passphrase: data.kucoin_passphrase
        },
        coinbase: {
            apiKey: data.coinbase_api_key,
            apiSecret: data.coinbase_api_secret,
            passphrase: data.coinbase_passphrase
        }
    };
};

// ======================================================
// GET ACCOUNTS
// ======================================================
export const getAccounts = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
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
};

// ======================================================
// SAVE ACCOUNT - Updated to handle platform deletions on overwrite
// ======================================================
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
            .select('*')
            .eq('user_id', user.id)
            .single();

        let result;
        let platformsToRefetch = [];

        if (existingAccount) {
            // Check which platforms changed
            const binanceChanged = (accountData.binance_api_key !== existingAccount.binance_api_key) ||
                (accountData.binance_api_secret !== existingAccount.binance_api_secret);

            const kucoinChanged = (accountData.kucoin_api_key !== existingAccount.kucoin_api_key) ||
                (accountData.kucoin_api_secret !== existingAccount.kucoin_api_secret) ||
                (accountData.kucoin_passphrase !== existingAccount.kucoin_passphrase);

            const coinbaseChanged = (accountData.coinbase_api_key !== existingAccount.coinbase_api_key) ||
                (accountData.coinbase_api_secret !== existingAccount.coinbase_api_secret) ||
                (accountData.coinbase_passphrase !== existingAccount.coinbase_passphrase);

            const ethChanged = (accountData.eth_address !== existingAccount.eth_address) ||
                (accountData.etherscan_api_key !== existingAccount.etherscan_api_key);

            // Delete old transactions for changed platforms
            if (binanceChanged && existingAccount.binance_api_key) {
                const deleted = await deletePlatformTransactions(user.id, 'binance');
                console.log(`[saveAccount] Deleted ${deleted} old Binance transactions`);
                if (accountData.binance_api_key && accountData.binance_api_secret) {
                    platformsToRefetch.push('binance');
                }
            }

            if (kucoinChanged && existingAccount.kucoin_api_key) {
                const deleted = await deletePlatformTransactions(user.id, 'kucoin');
                console.log(`[saveAccount] Deleted ${deleted} old KuCoin transactions`);
                if (accountData.kucoin_api_key && accountData.kucoin_api_secret && accountData.kucoin_passphrase) {
                    platformsToRefetch.push('kucoin');
                }
            }

            if (coinbaseChanged && existingAccount.coinbase_api_key) {
                const deleted = await deletePlatformTransactions(user.id, 'coinbase');
                console.log(`[saveAccount] Deleted ${deleted} old Coinbase transactions`);
                if (accountData.coinbase_api_key && accountData.coinbase_api_secret && accountData.coinbase_passphrase) {
                    platformsToRefetch.push('coinbase');
                }
            }

            if (ethChanged && existingAccount.eth_address) {
                const deleted = await deletePlatformTransactions(user.id, 'ethereum');
                console.log(`[saveAccount] Deleted ${deleted} old Ethereum transactions`);
                if (accountData.eth_address && accountData.etherscan_api_key) {
                    platformsToRefetch.push('ethereum');
                }
            }

            // Update account
            const { data, error } = await supabase
                .from('accounts')
                .update(accountData)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // New account - just insert
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

            // Fetch all platforms for new account
            if (accountData.binance_api_key) platformsToRefetch.push('binance');
            if (accountData.kucoin_api_key) platformsToRefetch.push('kucoin');
            if (accountData.coinbase_api_key) platformsToRefetch.push('coinbase');
            if (accountData.eth_address) platformsToRefetch.push('ethereum');
        }

        // Build credentials object
        const userCreds = {
            ethAddress: accountData.eth_address,
            etherscanApiKey: accountData.etherscan_api_key,
            binance: {
                apiKey: accountData.binance_api_key,
                apiSecret: accountData.binance_api_secret
            },
            kucoin: {
                apiKey: accountData.kucoin_api_key,
                apiSecret: accountData.kucoin_api_secret,
                passphrase: accountData.kucoin_passphrase
            },
            coinbase: {
                apiKey: accountData.coinbase_api_key,
                apiSecret: accountData.coinbase_api_secret,
                passphrase: accountData.coinbase_passphrase
            }
        };

        // Fetch and save transactions for platforms that need refetching
        let transactionsSaved = 0;
        if (platformsToRefetch.length > 0 || !existingAccount) {
            try {
                console.log(`[saveAccount] Starting transaction fetch for platforms: ${platformsToRefetch.length > 0 ? platformsToRefetch.join(', ') : 'all'} for user ${user.id}...`);
                const allTransactions = await getAllTransactionsFromAPIs(userCreds);
                console.log(`[saveAccount] Fetched ${allTransactions.length} transactions`);

                transactionsSaved = await saveTransactionsToDB(user.id, allTransactions, true);
                console.log(`[saveAccount] Saved ${transactionsSaved} transactions`);
            } catch (fetchError) {
                console.error(`[saveAccount] Transaction fetch failed:`, fetchError);
                return res.status(201).json({
                    success: true,
                    warning: `Account saved but transaction sync failed: ${fetchError.message}`,
                    account: result,
                    transactionsSynced: 0
                });
            }
        }

        res.status(200).json({
            success: true,
            message: transactionsSaved > 0
                ? `Account saved successfully with ${transactionsSaved} transactions synced`
                : 'Account saved successfully (no new transactions found)',
            account: result,
            transactionsSynced: transactionsSaved
        });

    } catch (err) {
        console.error('Error saving account:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to save account'
        });
    }
};

// ======================================================
// UPDATE ACCOUNT - Updated to delete old data when platforms change
// ======================================================
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

        // Get existing account
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

        // Track which platforms changed and need refetching
        const platformsToDelete = [];
        const platformsToRefetch = [];

        // Check Binance
        const binanceHasOld = existingAccount.binance_api_key && existingAccount.binance_api_secret;
        const binanceHasNew = accountData.binance_api_key && accountData.binance_api_secret;
        const binanceChanged = binanceHasOld !== binanceHasNew ||
            (binanceHasOld && binanceHasNew &&
                (accountData.binance_api_key !== existingAccount.binance_api_key ||
                    accountData.binance_api_secret !== existingAccount.binance_api_secret));

        if (binanceChanged) {
            if (binanceHasOld) platformsToDelete.push('binance');
            if (binanceHasNew) platformsToRefetch.push('binance');
        }

        // Check KuCoin
        const kucoinHasOld = existingAccount.kucoin_api_key && existingAccount.kucoin_api_secret && existingAccount.kucoin_passphrase;
        const kucoinHasNew = accountData.kucoin_api_key && accountData.kucoin_api_secret && accountData.kucoin_passphrase;
        const kucoinChanged = kucoinHasOld !== kucoinHasNew ||
            (kucoinHasOld && kucoinHasNew &&
                (accountData.kucoin_api_key !== existingAccount.kucoin_api_key ||
                    accountData.kucoin_api_secret !== existingAccount.kucoin_api_secret ||
                    accountData.kucoin_passphrase !== existingAccount.kucoin_passphrase));

        if (kucoinChanged) {
            if (kucoinHasOld) platformsToDelete.push('kucoin');
            if (kucoinHasNew) platformsToRefetch.push('kucoin');
        }

        // Check Coinbase
        const coinbaseHasOld = existingAccount.coinbase_api_key && existingAccount.coinbase_api_secret && existingAccount.coinbase_passphrase;
        const coinbaseHasNew = accountData.coinbase_api_key && accountData.coinbase_api_secret && accountData.coinbase_passphrase;
        const coinbaseChanged = coinbaseHasOld !== coinbaseHasNew ||
            (coinbaseHasOld && coinbaseHasNew &&
                (accountData.coinbase_api_key !== existingAccount.coinbase_api_key ||
                    accountData.coinbase_api_secret !== existingAccount.coinbase_api_secret ||
                    accountData.coinbase_passphrase !== existingAccount.coinbase_passphrase));

        if (coinbaseChanged) {
            if (coinbaseHasOld) platformsToDelete.push('coinbase');
            if (coinbaseHasNew) platformsToRefetch.push('coinbase');
        }

        // Check Ethereum Wallet
        const ethHasOld = existingAccount.eth_address && existingAccount.etherscan_api_key;
        const ethHasNew = accountData.eth_address && accountData.etherscan_api_key;
        const ethChanged = ethHasOld !== ethHasNew ||
            (ethHasOld && ethHasNew &&
                (accountData.eth_address !== existingAccount.eth_address ||
                    accountData.etherscan_api_key !== existingAccount.etherscan_api_key));

        if (ethChanged) {
            if (ethHasOld) platformsToDelete.push('ethereum');
            if (ethHasNew) platformsToRefetch.push('ethereum');
        }

        // Delete old transactions for changed platforms
        for (const platform of platformsToDelete) {
            const deleted = await deletePlatformTransactions(user.id, platform);
            console.log(`[updateAccount] Deleted ${deleted} old ${platform} transactions`);
        }

        // Update the account
        const { data, error } = await supabase
            .from('accounts')
            .update(accountData)
            .eq('id', accountId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        // Fetch and save transactions for new/updated platforms
        let transactionsSaved = 0;
        if (platformsToRefetch.length > 0) {
            try {
                const userCreds = {
                    ethAddress: accountData.eth_address || existingAccount.eth_address,
                    etherscanApiKey: accountData.etherscan_api_key || existingAccount.etherscan_api_key,
                    binance: {
                        apiKey: accountData.binance_api_key || existingAccount.binance_api_key,
                        apiSecret: accountData.binance_api_secret || existingAccount.binance_api_secret
                    },
                    kucoin: {
                        apiKey: accountData.kucoin_api_key || existingAccount.kucoin_api_key,
                        apiSecret: accountData.kucoin_api_secret || existingAccount.kucoin_api_secret,
                        passphrase: accountData.kucoin_passphrase || existingAccount.kucoin_passphrase
                    },
                    coinbase: {
                        apiKey: accountData.coinbase_api_key || existingAccount.coinbase_api_key,
                        apiSecret: accountData.coinbase_api_secret || existingAccount.coinbase_api_secret,
                        passphrase: accountData.coinbase_passphrase || existingAccount.coinbase_passphrase
                    }
                };

                console.log(`[updateAccount] Fetching transactions for platforms: ${platformsToRefetch.join(', ')}`);
                const allTransactions = await getAllTransactionsFromAPIs(userCreds);
                transactionsSaved = await saveTransactionsToDB(user.id, allTransactions, true);
                console.log(`[updateAccount] Saved ${transactionsSaved} transactions`);
            } catch (fetchError) {
                console.error("[updateAccount] Transaction fetch failed:", fetchError);
            }
        }

        res.status(200).json({
            success: true,
            message: transactionsSaved > 0
                ? `Account updated successfully with ${transactionsSaved} transactions synced`
                : 'Account updated successfully',
            account: data,
            transactionsSynced: transactionsSaved,
            platformsRefetched: platformsToRefetch,
            platformsDeleted: platformsToDelete
        });

    } catch (err) {
        console.error('Error updating account:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to update account'
        });
    }
};

// ======================================================
// DELETE ACCOUNT - Delete ALL transactions when deleting entire account
// ======================================================
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

        // Delete ALL transactions for this user first
        const { error: deleteTransactionsError } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id);

        if (deleteTransactionsError) {
            console.error('Error deleting transactions:', deleteTransactionsError);
        }

        // Delete the account
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', accountId)
            .eq('user_id', user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Account and all associated transactions deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to delete account'
        });
    }
};

// ======================================================
// DELETE EXCHANGE DATA - Delete credentials and associated transactions
// ======================================================
export const deleteExchangeData = async (req, res) => {
    try {
        const user = req.user;
        const { exchangeType } = req.body;

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

        const exchangeFields = {
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

        const updateData = {};
        fieldsToClear.forEach(field => {
            updateData[field] = null;
        });

        const { error } = await supabase
            .from('accounts')
            .update(updateData)
            .eq('user_id', user.id);

        if (error) throw error;

        // Delete associated transactions for this platform
        const platformMap = {
            wallet: 'ethereum',
            binance: 'binance',
            kucoin: 'kucoin',
            coinbase: 'coinbase'
        };

        const platform = platformMap[exchangeType];
        if (platform) {
            const deletedCount = await deletePlatformTransactions(user.id, platform);
            console.log(`[deleteExchangeData] Deleted ${deletedCount} ${platform} transactions`);
        }

        res.status(200).json({
            success: true,
            message: `${exchangeType} data and associated transactions deleted successfully`
        });

    } catch (err) {
        console.error('Error deleting exchange data:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to delete exchange data'
        });
    }
};