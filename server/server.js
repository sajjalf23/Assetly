import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import ratelimit from "express-rate-limit"
import authRouter from "./routes/authRouter.js"
import newsRouter from "./routes/newsRouter.js"
import forexRouter from "./routes/forexRouter.js"
import cryptoRouter from "./routes/cryptoRouter.js"
import stocksRouter from "./routes/stocksRouter.js"
import accountRouter from "./routes/accountRouter.js"

dotenv.config();

const app = express();

// app.use(helmet());

app.use(helmet({
  contentSecurityPolicy: false,
  hsts: false, // Disable HSTS (HTTPS forcing)
}));

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
app.use('/api/news', newsRouter);
app.use('/api/forex', forexRouter);
app.use('/api/crypto', cryptoRouter);
app.use('/api/stocks',stocksRouter);
app.use('/api/account', accountRouter);

const PORT = process.env.PORT || 5000
app.listen(PORT , ()=> console.log(`server is running at port : ${PORT}`))