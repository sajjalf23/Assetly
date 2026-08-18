import express from "express"
import { stocksController } from "../controllers/stocksController.js"
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router()

router.get('/trades', authenticateUser, stocksController)

export default router
