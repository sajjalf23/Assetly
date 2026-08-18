import express from "express";
import { getUserTransactionHistory, getTransactionsByAccount, exportUserTransactions } from "../controllers/transactionController.js";
import { dailyTransactionSync } from "../controllers/fetchAndSaveController.js";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.get("/history", authenticateUser, getUserTransactionHistory);
router.get("/history/:account", authenticateUser, getTransactionsByAccount);
router.get("/export", authenticateUser, exportUserTransactions);

// Admin route - protect with API key in production
router.post("/daily-sync", dailyTransactionSync);

export default router;