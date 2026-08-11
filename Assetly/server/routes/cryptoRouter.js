import express from "express"
import { getUserCryptoPortfolio, getCoinGeckoData } from '../controllers/cryptoController.js'
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router()

router.get('/trades',verifySupabaseToken, getUserCryptoPortfolio)
router.post("/coingecko", verifySupabaseToken, getCoinGeckoData);
export default router;