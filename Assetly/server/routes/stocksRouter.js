import express from "express"
import {stocksController} from "../controllers/stocksController.js"

const router = express.Router()

router.get('/trades', stocksController)

export default router
