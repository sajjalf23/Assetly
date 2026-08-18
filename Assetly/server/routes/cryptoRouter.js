import express from "express"
import { getUserCryptoPortfolio, getCoinGeckoData } from '../controllers/cryptoController.js'
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router()

router.get('/trades', authenticateUser, getUserCryptoPortfolio)
router.post("/coingecko", authenticateUser, getCoinGeckoData);
export default router;