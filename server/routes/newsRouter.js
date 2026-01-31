import express from "express";
import { getNews } from "../controllers/newsController.js"; 

const router = express.Router();

// GET /api/news
router.get('/all', getNews);

export default router;
