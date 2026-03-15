import express from "express"
import { getUserCryptoPortfolio } from '../controllers/cryptoController.js'
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router()

router.get('/trades',verifySupabaseToken, getUserCryptoPortfolio)
export default router;