import express from "express"
import { homeController } from '../controllers/homeController.js'
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router()

router.get('/page', verifySupabaseToken, homeController)
export default router;