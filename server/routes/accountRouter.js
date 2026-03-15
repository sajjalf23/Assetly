import express from 'express';
import {
    getAccounts,
    saveAccount,
    updateAccount,
    deleteAccount,
    deleteExchangeData
} from '../controllers/accountsController.js';
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router();

// Apply authentication middleware to all account routes
router.use(verifySupabaseToken);

// These routes will be accessible at /api/account/accounts
router.get('/accounts', getAccounts);
router.post('/accounts', saveAccount);
router.put('/accounts/:accountId', updateAccount);
router.delete('/accounts/:accountId', deleteAccount);
router.delete('/exchange-data', deleteExchangeData); // Changed from /accounts/exchange-data

export default router;