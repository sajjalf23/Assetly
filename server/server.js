import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import ratelimit from "express-rate-limit"
import authRouter from "./routes/authRouter.js"
import forexController from './routes/forexRoute.js'

dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",  
  credentials: true,                
}));

app.use(express.json())

const limiter = ratelimit({
    windowMs : 15 * 60 * 1000,
    max : 200
})
app.use(limiter)


app.get("/",(req,res)=>{
    res.json({ message : "Server is running "})
})

app.use('/api/auth',authRouter);
app.use('/api/forex', forexController)

const PORT = process.env.PORT || 5000
app.listen(PORT , ()=> console.log(`server is running at port : ${PORT}`))