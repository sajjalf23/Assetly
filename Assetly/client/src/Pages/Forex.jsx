import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { LuArrowRightLeft, LuSearch } from "react-icons/lu";
import countryList from '../data/countryCode';

// Colors
const COLORS = ["#2285c3", "#c35f22", "#c38d22", "#227c5d", "#8c22c3", "#c3225f"];

// Custom Pie tooltip
const CustomToolTip = ({ active, payload, total }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] pl-1 pr-3 shadow-lg'>
                <p>{payload[0].name}</p>
                <p>{payload[0].value.toLocaleString('de-DE')} €</p>
                <p>{((payload[0].value / total) * 100).toFixed(2)}%</p>
            </div>
        )
    }
}

// Custom Line tooltip
const CustomToolTipLine = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] p-2 shadow-lg'>
                <p>{payload[0].name}</p>
                <p>Units: {payload[0].value.toLocaleString('de-DE')}</p>
            </div>
        )
    }
}

export default function Forex() {
    const base_URL = "https://v6.exchangerate-api.com/v6/71d302ff631e71b4d6fdcac2/latest";

    const [fromCurr, setFromCurr] = useState("USD");
    const [toCurr, setToCurr] = useState("PKR");
    const [fromValue, setFromValue] = useState("");
    const [toValue, setToValue] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Backend data
    const [tradesData, setTradesData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [total, setTotal] = useState(0);

    // Fetch backend trades
    const fetchBackendData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/forex/trades');
            const data = await res.json();
            const tradesArray = data.trades || [];
            setTradesData(tradesArray);

            const mappedData = tradesArray.map(item => ({
                pair: item.instrument,
                name: item.instrument.replace("_USD", ""),
                value: parseFloat(item.initialUnits || 0),
                pnl: parseFloat(item.price || 0),
                monthlyChange: 0
            })).sort((a, b) => b.value - a.value);

            setChartData(mappedData);

            const totalTrades = mappedData.reduce((sum, item) => sum + item.value, 0);
            setTotal(totalTrades);

        } catch (err) {
            console.error("Error fetching backend data:", err);
        }
    }

    useEffect(() => {
        fetchBackendData();
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
        let temp = fromCurr;
        setFromCurr(toCurr);
        setToCurr(temp);
        fetchDataWithCurrencies(toCurr, temp);
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
            const amt = amount * rate;
            setToValue(amt.toFixed(2));
            setShowResult(true);
        } catch (error) {
            alert("Error fetching conversion rate");
        }
    }

    const displayData = searchQuery ? filteredData : chartData;

    return (
        <div className='flex flex-col'>
            <div className='min-h-screen bg-[#0d0d0d] text-white flex flex-row p-6 gap-8 pt-10'>
                <div className='flex flex-col w-1/2 gap-6'>
                    {/* Market Overview */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <h1 className='text-lg font-bold'>Market Overview</h1>
                        <div className='grid grid-cols-2 gap-5 text-gray-300 pt-6'>
                            <div>
                                <p className='text-sm text-[#ababab]'>Gold Rate</p>
                                <p className='text-lg font-semibold text-yellow-400'>$2,375</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-400'>Silver Rate</p>
                                <p className='text-lg font-semibold text-gray-300'>$28.50</p>
                            </div>
                        </div>
                    </div>

                    {/* Line chart */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <h2 className='text-xl font-semibold mb-4 text-white'>Forex Asset Trend</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={displayData}>
                                <XAxis dataKey="name" stroke="#aaa" interval={0} tick={{ fontSize: 12 }} padding={{ left: 20, right: 20 }} />
                                <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomToolTipLine />} />
                                <Line type="monotone" dataKey="value" stroke="#2285c3" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className='flex flex-col gap-6 w-1/2'>
                    {/* currency converter */}
                    <div className='bg-[#181818] w-full p-6 rounded-2xl shadow-lg flex flex-col gap-3'>
                        <h1 className='text-lg font-semibold text-white'>Currency Converter</h1>
                        <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
                            <input name='input' type='number' placeholder='Amount' className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/3' onChange={handleChange} />
                            <select name='from' value={fromCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4' onChange={handleChange}>
                                {Object.keys(countryList).map(currency => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                            <span className='text-white cursor-pointer' onClick={swapPairs}><LuArrowRightLeft /></span>
                            <select name='to' value={toCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4' onChange={handleChange}>
                                {Object.keys(countryList).map(currency => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                            <button className='bg-[#2285c3] px-4 py-2 rounded-md text-white font-semibold hover:bg-[#1a6b9c] cursor-pointer' onClick={fetchData}>Convert</button>
                        </div>
                        {showResult && <div className='text-center'>{fromValue} {fromCurr} = {toValue} {toCurr}</div>}
                    </div>

                    {/* Pie chart */}
                    <div className='flex flex-col gap-6 items-center justify-center bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <div className='relative w-full max-w-md'>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart margin={{ top: 20, bottom: 20 }}>
                                    <Pie data={displayData} cx="50%" cy="50%" innerRadius={95} outerRadius={140} paddingAngle={0} dataKey="value" label={(entry) => entry.name} labelLine={false} stroke='none'>
                                        {displayData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index] || "#6B7280"} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomToolTip active total={total} />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center'>
                                <div className='text-white text-2xl font-semibold'>{total.toLocaleString('de-DE')} €</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trades table */}
            <div className="mx-full max-w-6xl px-6">
                <div className='flex items-center justify-between mb-3'>
                    <h1 className='text-white font-semibold text-xl'>All Assets</h1>
                    <div className='flex items-center gap-3 bg-[#181818] p-2 rounded-md w-full sm:w-1/4'>
                        <LuSearch size={20} className='text-white' />
                        <input type='text' placeholder='Search Pairs' value={searchQuery} onChange={handleSearch} spellCheck={false} className='bg-transparent text-white w-full focus:outline-none placeholder-gray-400' />
                    </div>
                </div>

                <div className='rounded-2xl overflow-hidden bg-[#181818] mt-6 mb-12 overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='text-sm font-medium text-[#ababab] bg-[#1f1f1f]'>
                            <tr>
                                <th className='pl-10 py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none'>Pair</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Trades Count</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Price</th>
                                <th className='pr-5 py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>% of trades</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((row, index) => (
                                <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                                    <td className='py-2.5 px-4 select-none'>
                                        <div className='flex items-center gap-3'>
                                            <div className='rounded-full h-3 w-3' style={{ background: COLORS[index] }}></div>
                                            <span>{row.pair}</span>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>{row.value}</td>
                                    <td className='py-3 px-4 text-right select-none'>{row.pnl}</td>
                                    <td className='py-3 px-4 pr-5 text-right select-none'>{((row.value / total) * 100).toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
