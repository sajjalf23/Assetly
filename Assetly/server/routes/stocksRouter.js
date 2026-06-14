import express from "express"
import {stocksController} from "../controllers/stocksController.js"
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router()

router.get('/trades', verifySupabaseToken, stocksController)

export default router
