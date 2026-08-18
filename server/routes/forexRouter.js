import express from "express"
import { forexController, getForexMarketOverview } from '../controllers/forexController.js'
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router()

router.get('/trades', authenticateUser, forexController);
router.get('/market-overview', authenticateUser, getForexMarketOverview);

export default router;