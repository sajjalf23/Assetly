import express from "express"
import { getCryptoWalletTrades } from '../controllers/cryptoController.js'

const router = express.Router()

router.get('/trades', getCryptoWalletTrades)
export default router;