import express from "express";
import { verifySupabaseToken } from "../middleware/verifySupabaseToken.js";
import { overviewController } from "../controllers/overviewController.js";

const router = express.Router();

router.get("/", verifySupabaseToken, overviewController);

export default router;