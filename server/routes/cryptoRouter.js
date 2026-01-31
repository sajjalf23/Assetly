import express from "express"
import { getUserCryptoPortfolio } from '../controllers/cryptoController.js'

const router = express.Router()

router.get('/trades', getUserCryptoPortfolio)
export default router;