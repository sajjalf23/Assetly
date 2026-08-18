import express from 'express';
import { getEarnings } from '../controllers/earningsController.js';
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/data', authenticateUser, getEarnings);
export default router;