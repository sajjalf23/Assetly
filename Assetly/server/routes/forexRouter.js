import express from "express"
import { forexController } from '../controllers/forexController.js'
import {verifySupabaseToken} from '../middleware/verifySupabaseToken.js';

const router = express.Router()

router.get('/trades',verifySupabaseToken, forexController);

export default router;