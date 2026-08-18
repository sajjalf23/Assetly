import { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip
} from 'recharts';
import { LuSearch, LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import API from '../Api/axios';

// Colors
const COLORS = ["#2285c3", "#c35f22", "#c38d22", "#227c5d", "#8c22c3", "#c3225f"];

// Custom Pie tooltip
const CustomToolTip = ({ active, payload, total }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] pl-1 pr-3 shadow-lg'>
                <p>{payload[0].name}</p>
                <p>{payload[0].value.toLocaleString('en-US')} $</p>
                <p>{((payload[0].value / total) * 100).toFixed(2)}%</p>
            </div>
        );
    }
    return null;
};

// Custom Line tooltip
const CustomToolTipLine = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] p-2 shadow-lg'>
                <p>{payload[0].name}</p>
                <p>Units: {payload[0].value.toLocaleString('en-US')}</p>
            </div>
        );
    }
    return null;
};

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export default function Stocks() {
    const [searchQuery, setSearchQuery] = useState("");
    const [marketOverview, setMarketOverview] = useState({
        top1: null,
        top2: null,
    });

    // Backend data
    const [chartData, setChartData] = useState([]);
    const [snapshotData, setSnapshotData] = useState([]);
    const [total, setTotal] = useState(0);

    const [isMarketDataLoading, setIsMarketDataLoading] = useState(true);
    const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);

    const fetchTopStocks = async () => {
        try {
            const [apple, nvidia] = await Promise.all([
                fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`),
                fetch(`https://finnhub.io/api/v1/quote?symbol=NVDA&token=${FINNHUB_API_KEY}`)
            ]);

            const appleData = await apple.json();
            const nvidiaData = await nvidia.json();

            setMarketOverview({
                top1: {
                    symbol: "AAPL",
                    price: appleData.c,
                    change: appleData.dp
                },
                top2: {
                    symbol: "NVDA",
                    price: nvidiaData.c,
                    change: nvidiaData.dp
                }
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsMarketDataLoading(false);
        }
    };

    // Fetch backend portfolio
    const fetchBackendData = async () => {
        try {
            setIsPortfolioLoading(true);

            const { data } = await API.get('/api/stocks/trades');

            const portfolio = data.portfolio || [];
            setSnapshotData(data.stocksSnapshots || []);

            const mappedData = portfolio.map(asset => ({
                symbol: asset.asset,
                name: asset.asset,
                pair: asset.asset,
                amount: asset.amount,
                price: 0,
                value: asset.amount,
                change24h: 0,
                tradeCount: asset.tradeCount,
                sources: asset.sources
            }));

            mappedData.sort((a, b) => b.value - a.value);

            const totalUnits = mappedData.reduce((sum, item) => sum + item.value, 0);

            setTotal(totalUnits);
            setChartData(mappedData);
        } catch (err) {
            console.error("Error fetching backend data:", err);
            setChartData([]);
            setTotal(0);
        } finally {
            setIsPortfolioLoading(false);
        }
    };

    useEffect(() => {
        fetchBackendData();
        fetchTopStocks();

        const interval = setInterval(() => {
            fetchTopStocks();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const filteredData = chartData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayData = searchQuery ? filteredData : chartData;

    return (
        <div className='flex flex-col'>
            <div className='bg-[#0d0d0d] text-white flex flex-row items-stretch p-6 gap-8 pt-10'>
                <div className='flex flex-col w-1/2 gap-6'>

                    {/* Market Overview Card */}
                    {/* Market Overview Card */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg border border-[#262626] transition-colors duration-200 hover:border-gray-700 min-h-[148px] flex flex-col justify-between'>

                        <h2 className='text-lg font-bold text-white tracking-wide'>
                            Market Overview
                        </h2>

                        {isMarketDataLoading ? (
                            <div className='grid grid-cols-2 gap-4 text-gray-300 pt-2'>

                                {/* Apple Skeleton */}
                                <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>
                                    <div className='h-3 bg-[#2a2a2a] animate-pulse rounded w-16 mb-2'></div>
                                    <div className='h-6 bg-[#2a2a2a] animate-pulse rounded w-24'></div>
                                </div>

                                {/* NVIDIA Skeleton */}
                                <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>
                                    <div className='h-3 bg-[#2a2a2a] animate-pulse rounded w-16 mb-2'></div>
                                    <div className='h-6 bg-[#2a2a2a] animate-pulse rounded w-24'></div>
                                </div>

                            </div>
                        ) : (
                            <div className='grid grid-cols-2 gap-4 text-gray-300 pt-2'>

                                {/* Apple */}
                                <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>

                                    <p className='text-xs uppercase font-semibold text-gray-400 tracking-wider mb-1'>
                                        Apple
                                    </p>

                                    <p className='text-xl font-bold text-white'>
                                        {marketOverview.top1?.change != null
                                            ? `${marketOverview.top1.price.toFixed(2)}$`
                                            : "--"
                                        }
                                    </p>

                                    <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${marketOverview.top1?.change >= 0
                                            ? "bg-green-900/30 text-green-400"
                                            : "bg-red-900/30 text-red-400"
                                            }`}
                                    >
                                        {marketOverview.top1?.change >= 0 ? (
                                            <LuTrendingUp size={14} />
                                        ) : (
                                            <LuTrendingDown size={14} />
                                        )}

                                        {marketOverview.top1
                                            ? `${marketOverview.top1.change.toFixed(2)}%`
                                            : "--"
                                        }
                                    </div>

                                </div>

                                {/* NVIDIA */}
                                <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>

                                    <p className='text-xs uppercase font-semibold text-gray-400 tracking-wider mb-1'>
                                        NVIDIA
                                    </p>

                                    <p className='text-xl font-bold text-white'>
                                        {marketOverview.top2?.change != null
                                            ? `${marketOverview.top2.price.toFixed(2)}$`
                                            : "--"
                                        }
                                    </p>

                                    <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${marketOverview.top2?.change >= 0
                                            ? "bg-green-900/30 text-green-400"
                                            : "bg-red-900/30 text-red-400"
                                            }`}
                                    >
                                        {marketOverview.top2?.change >= 0 ? (
                                            <LuTrendingUp size={14} />
                                        ) : (
                                            <LuTrendingDown size={14} />
                                        )}

                                        {marketOverview.top2
                                            ? `${marketOverview.top2.change.toFixed(2)}%`
                                            : "--"
                                        }
                                    </div>

                                </div>

                            </div>
                        )}

                    </div>

                    {/* Line Chart */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <h2 className='text-xl font-semibold mb-4 text-white'>
                            Stock Asset Trend
                        </h2>
                        {isPortfolioLoading ? (
                            <div className='h-[200px] w-full bg-[#202020] rounded-xl animate-pulse flex items-center justify-center'>
                                <div className='h-full w-full bg-[#2a2a2a] rounded-xl opacity-50'></div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={snapshotData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="month" stroke="#aaa" interval={0} tick={{ fontSize: 12 }} padding={{ left: 20, right: 20 }} />
                                    <YAxis stroke="#aaa" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomToolTipLine />} />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#2285c3"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie Chart Skeleton */}
                <div className='flex flex-col gap-6 w-1/2'>
                    <div className='flex-1 flex flex-col items-center justify-center bg-[#181818] p-6 rounded-2xl shadow-lg min-h-[300px]'>
                        {isPortfolioLoading ? (
                            <div className='relative w-64 h-64 flex items-center justify-center animate-pulse'>
                                <div className='w-56 h-56 rounded-full border-[18px] border-[#2a2a2a] flex items-center justify-center'>
                                    <div className='h-8 bg-[#2a2a2a] rounded w-24'></div>
                                </div>
                            </div>
                        ) : (
                            <div className='relative w-full max-w-md h-[280px]'>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart margin={{ top: 20, bottom: 20 }}>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            dataKey="value"
                                            label={({ percent, symbol }) => percent > 0.05 ? symbol : ""}
                                            labelLine={false}
                                            stroke="none"
                                        >
                                            {displayData.map((_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={COLORS[index] || "#6B7280"}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomToolTip total={total} />} />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center'>
                                    <div className='text-white text-2xl font-semibold'>
                                        {total.toLocaleString('en-US')} $
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="mx-full max-w-6xl px-6">
                <div className='flex items-center justify-between mb-3'>
                    <h1 className='text-white font-semibold text-xl'>All Assets</h1>
                    <div className='flex items-center gap-3 bg-[#181818] p-2 rounded-md w-full sm:w-1/4'>
                        <LuSearch size={20} className='text-white' />
                        <input
                            type='text'
                            placeholder='Search Pairs'
                            value={searchQuery}
                            onChange={handleSearch}
                            className='bg-transparent text-white w-full focus:outline-none'
                        />
                    </div>
                </div>

                <div className='rounded-2xl overflow-hidden bg-[#181818] mt-6 mb-12 overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='text-sm text-[#ababab] bg-[#1f1f1f]'>
                            <tr>
                                <th className='pl-10 py-2.5 text-left'>Pair</th>
                                <th className='py-2.5 text-right'>Units</th>
                                <th className='py-2.5 text-right'>Price</th>
                                <th className='pr-5 py-2.5 text-right'>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isPortfolioLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className='border-b border-[#2a2a2a] animate-pulse'>
                                        <td className='px-4 py-3.5'>
                                            <div className='flex items-center gap-3'>
                                                <div className='rounded-full h-3 w-3 bg-[#2a2a2a]'></div>
                                                <div className='h-4 bg-[#2a2a2a] rounded w-16'></div>
                                            </div>
                                        </td>
                                        <td className='py-3.5 px-4 text-right'>
                                            <div className='h-4 bg-[#2a2a2a] rounded w-12 ml-auto'></div>
                                        </td>
                                        <td className='py-3.5 px-4 text-right'>
                                            <div className='h-4 bg-[#2a2a2a] rounded w-12 ml-auto'></div>
                                        </td>
                                        <td className='py-3.5 px-4 pr-5 text-right'>
                                            <div className='h-4 bg-[#2a2a2a] rounded w-10 ml-auto'></div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                displayData.map((row, index) => (
                                    <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                                        <td className='px-4 py-2.5 select-none'>
                                            <div className='flex items-center gap-3'>
                                                <div className='rounded-full h-3 w-3' style={{ background: COLORS[index] }}></div>
                                                <span>{row.symbol}</span>
                                            </div>
                                        </td>
                                        <td className='py-3 px-4 text-right select-none'>{row.value.toFixed(2)}</td>
                                        <td className='py-3 px-4 text-right select-none'>{row.price.toFixed(2)}</td>
                                        <td className='py-3 px-4 pr-5 text-right select-none'>
                                            {total > 0
                                                ? ((row.value / total) * 100).toFixed(2)
                                                : "0.00"}%
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}