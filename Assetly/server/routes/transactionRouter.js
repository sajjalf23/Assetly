import express from "express";
import { getUserTransactionHistory, getTransactionsByAccount } from "../controllers/transactionController.js";
import { dailyTransactionSync } from "../controllers/fetchAndSaveController.js";
import { verifySupabaseToken } from "../middleware/verifySupabaseToken.js";

const router = express.Router();

// Protected routes
router.get("/history", verifySupabaseToken, getUserTransactionHistory);
router.get("/history/:account", verifySupabaseToken, getTransactionsByAccount);

// Admin route - protect with API key in production
router.post("/daily-sync", dailyTransactionSync);

export default router;