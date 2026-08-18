import express from 'express';
import {
    getAccounts,
    saveAccount,
    updateAccount,
    deleteAccount,
    deleteExchangeData
} from '../controllers/accountsController.js';
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticateUser); // Apply authentication middleware to all routes in this router

router.get('/accounts', getAccounts);
router.post('/accounts', saveAccount);
router.put('/accounts/:accountId', updateAccount);
router.delete('/accounts/:accountId', deleteAccount);
router.delete('/exchange-data', deleteExchangeData);

export default router;