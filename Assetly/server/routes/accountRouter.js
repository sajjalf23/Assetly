import express from 'express';
import {
    getAccounts,
    saveAccount,
    updateAccount,
    deleteAccount,
    deleteExchangeData
} from '../controllers/accountsController.js';
import { verifySupabaseToken } from '../middleware/verifySupabaseToken.js';

const router = express.Router();

router.use(verifySupabaseToken);

router.get('/accounts', getAccounts);
router.post('/accounts', saveAccount);
router.put('/accounts/:accountId', updateAccount);
router.delete('/accounts/:accountId', deleteAccount);
router.delete('/exchange-data', deleteExchangeData);

export default router;