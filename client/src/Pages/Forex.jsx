import { useState, useEffect, useContext } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { LuArrowRightLeft, LuSearch } from "react-icons/lu";
import countryList from '../data/countryCode';
import { AppContext } from '../context/appContext';
import API from '../Api/axios';

// Colors
const COLORS = ["#2285c3", "#c35f22", "#c38d22", "#227c5d", "#8c22c3", "#c3225f"];

// Custom Pie tooltip
const CustomToolTip = ({ active, payload, total }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] p-2 rounded shadow-lg text-white text-xs'>
                <p className='font-semibold'>{payload[0].name}</p>
                <p>{payload[0].value.toLocaleString()} Units</p>
                <p>{total > 0 ? ((payload[0].value / total) * 100).toFixed(2) : 0}%</p>
            </div>
        );
    }
    return null;
};

// Custom Line tooltip
const CustomToolTipLine = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const point = payload[0].payload;

        return (
            <div className='bg-[#3a3a3a] p-2 rounded-md shadow-lg'>
                <p className='text-gray-300'>{point.month}</p>
                <p className='text-white font-semibold'>
                    ${Number(point.value).toLocaleString()}
                </p>
            </div>
        );
    }

    return null;
};

export default function Forex() {
    const base_URL = "https://v6.exchangerate-api.com/v6/71d302ff631e71b4d6fdcac2/latest";

    const [fromCurr, setFromCurr] = useState("USD");
    const [toCurr, setToCurr] = useState("PKR");
    const [fromValue, setFromValue] = useState("");
    const [toValue, setToValue] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Loading states
    const [loadingMarket, setLoadingMarket] = useState(true);
    const [loadingData, setLoadingData] = useState(true);

    const [marketOverview, setMarketOverview] = useState({
        gold: null,
        silver: null,
    });
    const [exchangeRate, setExchangeRate] = useState(null);
    const { BackendUrl } = useContext(AppContext);

    // Backend data
    const [chartData, setChartData] = useState([]);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState(null);
    const [snapshots, setSnapshots] = useState([]);

    // Fetch backend trades
    const fetchBackendData = async () => {
        setLoadingData(true);
        try {
            const { data } = await API.get('/api/forex/trades');

            if (!data.success) throw new Error(data.message);

            const portfolio = Array.isArray(data.portfolio) ? data.portfolio : [];

            setSummary(data.summary || null);
            setSnapshots(data.forexSnapshots || []);

            const mappedData = portfolio
                .map(asset => ({
                    pair: asset.asset.replace("_", "/"),
                    name: asset.asset,
                    value: Math.abs(asset.amount),
                    units: Math.abs(asset.amount),
                    position: asset.amount > 0 ? "Long" : "Short",
                    source: asset.sources?.join(", ") || "-",
                }))
                .sort((a, b) => b.value - a.value);

            setChartData(mappedData);
            setTotal(mappedData.reduce((sum, item) => sum + item.value, 0));
        } catch (err) {
            console.error("Error fetching backend data:", err);
        } finally {
            setLoadingData(false);
        }
    };
    const fetchMarketOverview = async () => {
        try {
            const { data } = await API.get('/api/forex/market-overview');
            setMarketOverview({
                gold: data.gold,
                silver: data.silver,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMarket(false);
        }
    };

    useEffect(() => {
        fetchBackendData();
        fetchMarketOverview();

        const interval = setInterval(() => {
            fetchMarketOverview();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'from') setFromCurr(value);
        else if (name === 'to') setToCurr(value);
        else if (name === 'input') setFromValue(value);
    }

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const filteredData = chartData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function swapPairs() {
        const newFrom = toCurr;
        const newTo = fromCurr;
        setFromCurr(newFrom);
        setToCurr(newTo);
        fetchDataWithCurrencies(newFrom, newTo);
    }

    async function fetchData() {
        fetchDataWithCurrencies(fromCurr, toCurr);
    }

    async function fetchDataWithCurrencies(from, to) {
        const amount = fromValue > 1 ? fromValue : 1;
        try {
            const URL = `${base_URL}/${from}`;
            const response = await fetch(URL);
            const data = await response.json();
            const rate = parseFloat(data.conversion_rates[to]);
            setExchangeRate(rate);

            const amt = amount * rate;
            setToValue(amt.toFixed(2));
            setShowResult(true);
        } catch (error) {
            alert("Error fetching conversion rate");
        }
    }

    const displayData = searchQuery ? filteredData : chartData;

    return (
        <div className='flex flex-col bg-[#0d0d0d] min-h-screen text-white'>
            <div className='flex flex-col md:flex-row p-6 gap-8 pt-10 items-stretch'>
                {/* Left Column */}
                <div className='flex flex-col gap-6 w-full md:w-1/2'>
                    {/* Market Overview Card */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg border border-[#262626] transition-colors duration-200 hover:border-gray-700 min-h-[148px] flex flex-col justify-between'>
                        <h2 className='text-lg font-bold text-white tracking-wide'>Market Overview</h2>
                        <div className='grid grid-cols-2 gap-4 text-gray-300 pt-2'>
                            <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>
                                <p className='text-xs uppercase font-semibold text-gray-400 tracking-wider mb-1'>Gold Rate (XAU)</p>
                                {marketOverview.gold !== null ? (
                                    <p className='text-xl font-bold text-amber-400'>
                                        ${marketOverview.gold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                ) : (
                                    <div className='h-7 w-24 bg-[#2a2a2a] animate-pulse rounded-md mt-1'></div>
                                )}
                            </div>
                            <div className='bg-[#202020] p-4 rounded-xl border border-[#2a2a2a]'>
                                <p className='text-xs uppercase font-semibold text-gray-400 tracking-wider mb-1'>Silver Rate (XAG)</p>
                                {marketOverview.silver !== null ? (
                                    <p className='text-xl font-bold text-slate-300'>
                                        ${marketOverview.silver.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                ) : (
                                    <div className='h-7 w-24 bg-[#2a2a2a] animate-pulse rounded-md mt-1'></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Line chart */}
                    <div className='h-[376px] bg-[#181818] p-6 rounded-2xl shadow-lg flex flex-col'>
                        <h2 className='text-xl font-semibold mb-4 text-white'>Forex Asset Trend</h2>
                        {loadingData ? (
                            <div className='h-[295px] w-full bg-[#202020] rounded-xl animate-pulse flex items-center justify-center'>
                                <div className='h-full w-full bg-[#2a2a2a] rounded-xl opacity-50'></div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={295}>
                                <LineChart data={snapshots} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="month" stroke="#aaa" interval={0} tick={{ fontSize: 12 }} padding={{ left: 20, right: 20 }} />
                                    <YAxis stroke="#aaa" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomToolTipLine />} />
                                    <Line type="monotone" dataKey="value" stroke="#2285c3" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className='flex flex-col gap-6 w-full md:w-1/2'>
                    {/* Currency converter */}
                    <div className='bg-[#181818] w-full p-6 rounded-2xl shadow-lg flex flex-col justify-between hover:bg-[#1f1f1f] transition-colors border border-[#262626] hover:border-gray-700 min-h-[148px]'>
                        <h1 className='text-lg font-semibold text-white pb-4 mt-2'>Currency Converter</h1>
                        <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
                            <input name='input' type='number' placeholder='Amount' value={fromValue} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/3 bg-transparent focus:outline-none' onChange={handleChange} />
                            <select name='from' value={fromCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4 bg-[#181818] focus:outline-none' onChange={handleChange}>
                                {Object.keys(countryList).map(currency => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                            <span className='text-white cursor-pointer hover:text-[#2285c3] transition-colors' onClick={swapPairs}><LuArrowRightLeft /></span>
                            <select name='to' value={toCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4 bg-[#181818] focus:outline-none' onChange={handleChange}>
                                {Object.keys(countryList).map(currency => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                            <button className='bg-[#2285c3] px-4 py-2 rounded-md text-white font-semibold hover:bg-[#1a6b9c] cursor-pointer transition-colors w-full sm:w-auto' onClick={fetchData}>Convert</button>
                        </div>

                        <div className='h-5 text-center font-semibold text-sm pt-2'>
                            {showResult && (
                                <span>{fromValue || "1"} {fromCurr} = {toValue} {toCurr}</span>
                            )}
                        </div>
                    </div>

                    {/* Pie chart */}
                    <div className='h-[376px] bg-[#181818] p-6 rounded-2xl shadow-lg flex items-center justify-center relative'>
                        {loadingData ? (
                            <div className='relative w-64 h-64 flex items-center justify-center animate-pulse'>
                                <div className='w-56 h-56 rounded-full border-[18px] border-[#2a2a2a] flex items-center justify-center'>
                                    <div className='h-8 bg-[#2a2a2a] rounded w-24'></div>
                                </div>
                            </div>
                        ) : (
                            <div className='relative w-full max-w-md h-full flex items-center justify-center'>
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                        <Pie data={displayData} cx="50%" cy="50%" innerRadius={95} outerRadius={135} paddingAngle={0} dataKey="value" label={(entry) => entry.name} labelLine={false} stroke='none'>
                                            {displayData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] || "#6B7280"} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomToolTip total={total} />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none'>
                                    <div className='text-white text-2xl font-semibold'>${total.toLocaleString('en-US')}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Trades table */}
            <div className="w-full max-w-7xl px-6 mx-auto">
                <div className='flex items-center justify-between mb-3 mt-4'>
                    <h1 className='text-white font-semibold text-xl'>All Assets</h1>
                    <div className='flex items-center gap-3 bg-[#181818] p-2 rounded-md w-full sm:w-1/4'>
                        <LuSearch size={20} className='text-white' />
                        <input type='text' placeholder='Search Pairs' value={searchQuery} onChange={handleSearch} spellCheck={false} className='bg-transparent text-white w-full focus:outline-none placeholder-gray-400' />
                    </div>
                </div>

                <div className='rounded-2xl overflow-hidden bg-[#181818] mt-6 mb-12 overflow-x-auto shadow-lg'>
                    <table className='w-full'>
                        <thead className='text-sm font-medium text-[#ababab] bg-[#1f1f1f]'>
                            <tr>
                                <th className='pl-10 py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none'>Pair</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Units</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Position</th>
                                <th className='pr-5 py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>% of Exposure</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx} className='border-b border-[#2a2a2a]'>
                                        <td className='py-3.5 px-10'><div className='h-4 w-24 bg-[#2a2a2a] rounded animate-pulse'></div></td>
                                        <td className='py-3.5 px-4'><div className='h-4 w-16 bg-[#2a2a2a] rounded animate-pulse ml-auto'></div></td>
                                        <td className='py-3.5 px-4'><div className='h-5 w-14 bg-[#2a2a2a] rounded-full animate-pulse ml-auto'></div></td>
                                        <td className='py-3.5 px-4 pr-5'><div className='h-4 w-12 bg-[#2a2a2a] rounded animate-pulse ml-auto'></div></td>
                                    </tr>
                                ))
                            ) : (
                                displayData.map((row, index) => (
                                    <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020] transition-colors'>
                                        <td className='py-2.5 px-4 select-none pl-10'>
                                            <div className='flex items-center gap-3'>
                                                <div className='rounded-full h-3 w-3' style={{ background: COLORS[index % COLORS.length] }}></div>
                                                <span>{row.pair}</span>
                                            </div>
                                        </td>
                                        <td className='py-3 px-4 text-right select-none'>{row.units.toLocaleString()}</td>
                                        <td className='py-3 px-4 text-right select-none'>
                                            <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${row.position === "Long"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                }`}>
                                                {row.position}
                                            </span>
                                        </td>
                                        <td className='py-3 px-4 pr-5 text-right select-none'>{total > 0
                                            ? ((row.value / total) * 100).toFixed(2)
                                            : "0.00"
                                        }%</td>
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