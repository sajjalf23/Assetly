import express from "express"
import { getForexTrades } from '../controllers/forexController.js'

const router = express.Router()

router.get('/trades', getForexTrades)

export default router;