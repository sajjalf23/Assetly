import axios from "axios";

const CACHE_DURATION = 15 * 60 * 1000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;

let cache = {
    data: null,
    expires: 0
};

const cryptoCoins = [
    { symbol: "BTC", id: "bitcoin" },
    { symbol: "ETH", id: "ethereum" },
    { symbol: "SOL", id: "solana" },
    { symbol: "BNB", id: "binancecoin" },
    { symbol: "XRP", id: "ripple" },
    { symbol: "DOGE", id: "dogecoin" },
    { symbol: "ADA", id: "cardano" },
    { symbol: "AVAX", id: "avalanche-2" }
];

const stocks = [
    "AAPL",
    "NVDA",
    "MSFT",
    "GOOGL",
    "META",
    "AMZN",
    "TSLA",
    "NFLX"
];

const forexPairs = [
    "EUR_USD",
    "GBP_USD",
    "USD_JPY",
    "AUD_USD",
    "USD_CAD",
    "XAU_USD",  // Gold to USD
    "XAG_USD",  // Silver to USD
    "NZD_USD"
];

const randomItem = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

export const getLandingPageData = async (req, res) => {

    if (Date.now() < cache.expires && cache.data) {
        return res.json(cache.data);
    }

    try {

        const crypto = randomItem(cryptoCoins);
        const stock = randomItem(stocks);
        const forex = randomItem(forexPairs);

        const [cryptoRes, stockRes, forexRes] = await Promise.all([

            axios.get(
                "https://api.coingecko.com/api/v3/simple/price",
                {
                    params: {
                        ids: crypto.id,
                        vs_currencies: "usd",
                        include_24hr_change: true
                    }
                }
            ),

            axios.get(`https://finnhub.io/api/v1/quote?symbol=${stock}&token=${FINNHUB_API_KEY}`),

            axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/pair/${forex.split("_")[0]}/${forex.split("_")[1]}`)

        ]);

        const forexData = {
            symbol: `${forex.split("_")[0]}/${forex.split("_")[1]}`,
            price: forexRes.data.conversion_rate,
            change: "+0.5"
        };

        cache.data = {

            success: true,

            crypto: {
                symbol: crypto.symbol,
                price: cryptoRes.data[crypto.id].usd,
                change:
                    cryptoRes.data[crypto.id].usd_24h_change
            },

            stock: {
                symbol: stock,
                price: stockRes.data.c,
                change:
                    ((stockRes.data.c - stockRes.data.pc) /
                        stockRes.data.pc) *
                    100
            },

            forex: forexData

        };

        cache.expires = Date.now() + CACHE_DURATION;

        res.json(cache.data);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

};