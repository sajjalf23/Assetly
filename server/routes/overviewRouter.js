import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { overviewController } from "../controllers/overviewController.js";

const router = express.Router();

router.get("/", authenticateUser, overviewController);

export default router;