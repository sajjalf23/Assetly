import express from 'express';
import { getEarnings } from '../controllers/earningsController.js';
import { verifySupabaseToken } from '../middleware/verifySupabaseToken.js';

const router = express.Router();

router.get('/data',verifySupabaseToken, getEarnings);
export default router;