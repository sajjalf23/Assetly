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
    "NZD_USD"
];

const randomItem = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

export const getLandingPageData = async (req, res) => {

    // ---------------------------------------------------------
    // RETURN CACHE IF STILL VALID
    // ---------------------------------------------------------
    if (Date.now() < cache.expires && cache.data) {
        return res.json(cache.data);
    }

    try {

        const crypto = randomItem(cryptoCoins);
        const stock = randomItem(stocks);
        const forex = randomItem(forexPairs);

        const [cryptoRes, stockRes, forexRes, goldRes] =
            await Promise.allSettled([

                // -------------------------------------------------
                // CRYPTO
                // -------------------------------------------------
                axios.get(
                    "https://api.coingecko.com/api/v3/simple/price",
                    {
                        params: {
                            ids: crypto.id,
                            vs_currencies: "usd",
                            include_24hr_change: true
                        },
                        timeout: 10000
                    }
                ),

                // -------------------------------------------------
                // STOCK
                // -------------------------------------------------
                axios.get(
                    "https://finnhub.io/api/v1/quote",
                    {
                        params: {
                            symbol: stock,
                            token: FINNHUB_API_KEY
                        },
                        timeout: 10000
                    }
                ),

                // -------------------------------------------------
                // FOREX
                // -------------------------------------------------
                axios.get(
                    `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/pair/${forex.split("_")[0]}/${forex.split("_")[1]}`,
                    {
                        timeout: 10000
                    }
                ),

                // -------------------------------------------------
                // GOLD
                // Gold API - XAU/USD
                // No API key required
                // -------------------------------------------------
                axios.get(
                    "https://api.gold-api.com/price/XAU",
                    {
                        timeout: 10000
                    }
                )
            ]);

        // =========================================================
        // VALIDATE CRYPTO
        // =========================================================

        if (cryptoRes.status !== "fulfilled") {
            throw new Error(
                `Crypto API failed: ${cryptoRes.reason?.message || "Unknown error"}`
            );
        }

        const cryptoData = cryptoRes.value.data?.[crypto.id];

        if (!cryptoData || cryptoData.usd == null) {
            throw new Error("Invalid crypto API response");
        }

        // =========================================================
        // VALIDATE STOCK
        // =========================================================

        if (stockRes.status !== "fulfilled") {
            throw new Error(
                `Stock API failed: ${stockRes.reason?.message || "Unknown error"}`
            );
        }

        const stockData = stockRes.value.data;

        if (!stockData || stockData.c == null) {
            throw new Error("Invalid stock API response");
        }

        const stockChange =
            stockData.pc && stockData.pc !== 0
                ? ((stockData.c - stockData.pc) / stockData.pc) * 100
                : null;

        // =========================================================
        // VALIDATE FOREX
        // =========================================================

        if (forexRes.status !== "fulfilled") {
            throw new Error(
                `Forex API failed: ${forexRes.reason?.message || "Unknown error"}`
            );
        }

        const forexData = forexRes.value.data;

        if (
            !forexData ||
            forexData.conversion_rate == null
        ) {
            throw new Error("Invalid forex API response");
        }

        // =========================================================
        // GOLD
        // =========================================================

        let goldData = null;
        let goldError = null;

        if (goldRes.status === "fulfilled") {

            const goldResponse = goldRes.value.data;

            /*
             * Gold API response is expected to contain:
             *
             * {
             *   symbol: "XAU",
             *   price: 4261.10,
             *   ...
             * }
             */

            if (
                goldResponse &&
                goldResponse.price != null
            ) {

                goldData = {
                    symbol: "XAU/USD",
                    price: Number(goldResponse.price),
                    change: null
                };

                console.log(
                    "Gold price fetched successfully:",
                    goldData.price
                );

            } else {

                goldError = "Invalid gold API response";

                console.error(
                    "Gold API returned invalid data:",
                    goldResponse
                );
            }

        } else {

            goldError =
                goldRes.reason?.message ||
                "Gold API request failed";

            console.error(
                "Gold price fetch failed:",
                goldError
            );
        }

        // =========================================================
        // FOREX RESPONSE
        // =========================================================

        const formattedForex = {
            symbol: `${forex.split("_")[0]}/${forex.split("_")[1]}`,
            price: Number(forexData.conversion_rate),

            // TODO:
            // ExchangeRate API does not provide daily percentage
            // change from this endpoint.
            change: null
        };

        // =========================================================
        // BUILD RESPONSE
        // =========================================================

        const responseData = {
            success: true,

            crypto: {
                symbol: crypto.symbol,
                price: Number(cryptoData.usd),
                change:
                    cryptoData.usd_24h_change != null
                        ? Number(cryptoData.usd_24h_change)
                        : null
            },

            stock: {
                symbol: stock,
                price: Number(stockData.c),
                change: stockChange
            },

            forex: formattedForex,

            // ALWAYS return gold.
            // Never silently remove it.
            gold: goldData,

            // Explicitly tell frontend if gold failed.
            goldAvailable: goldData !== null,

            ...(goldError && {
                goldError
            })
        };

        // =========================================================
        // CACHE
        // =========================================================

        cache.data = responseData;
        cache.expires = Date.now() + CACHE_DURATION;

        return res.json(responseData);

    } catch (err) {

        console.error(
            "Error in getLandingPageData:",
            err.message
        );

        // ---------------------------------------------------------
        // SERVE STALE CACHE IF AVAILABLE
        // ---------------------------------------------------------

        if (cache.data) {

            console.log(
                "Serving cached landing page data due to API error"
            );

            return res.json({
                ...cache.data,
                _cached: true,
                _error: err.message
            });
        }

        // ---------------------------------------------------------
        // NO CACHE AVAILABLE
        // ---------------------------------------------------------

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};