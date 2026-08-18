import express from "express"
import { homeController } from '../controllers/homeController.js'
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router()

router.get('/page', authenticateUser, homeController)
export default router;