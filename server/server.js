import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import cron from "node-cron"
import cookieParser from "cookie-parser"
import ratelimit from "express-rate-limit"
import authRouter from "./routes/authRouter.js"
import newsRouter from "./routes/newsRouter.js"
import forexRouter from "./routes/forexRouter.js"
import cryptoRouter from "./routes/cryptoRouter.js"
import stocksRouter from "./routes/stocksRouter.js"
import accountRouter from "./routes/accountRouter.js"
import transactionRouter from "./routes/transactionRouter.js";
import homeRouter from "./routes/homeRouter.js";
import runMonthlySnapshot from "../server/services/monthlySnapshot.js";
import overviewRouter from "./routes/overviewRouter.js";
import earningsRouter from "./routes/earningsRouter.js";
import landingPageRouter from "./routes/landingPageRouter.js";
import newsletterRouter from "./routes/newsletterRouter.js";

dotenv.config();

const app = express();

// app.use(helmet());

app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false, // Disable HSTS (HTTPS forcing)
}));

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "https://assetly-sigma.vercel.app",
    credentials: true,
}));

app.use(cookieParser());

app.use(express.json())

const limiter = ratelimit({
    windowMs: 15 * 60 * 1000,
    max: 200
})
app.use(limiter)


app.get("/", (req, res) => {
    res.json({ message: "Server is running " })
})

app.use('/api/auth', authRouter);
app.use('/api/news', newsRouter);
app.use('/api/forex', forexRouter);
app.use('/api/crypto', cryptoRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/account', accountRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/home', homeRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/earnings", earningsRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api", landingPageRouter);


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`server is running at port : ${PORT}`)

    // Schedule cron job when server starts
    cron.schedule("0 0 1 * *", () => {
        runMonthlySnapshot();
    });

});