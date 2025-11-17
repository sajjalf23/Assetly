import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { LuArrowRightLeft, LuSearch } from "react-icons/lu";
import { forexData, monthlyRevenueData } from '../data/forexData'
import countryList from '../data/countryCode';


// Color mapping to match the image
const COLORS = [
    "#2285c3", // Blue — your base
    "#c35f22", // Burnt Orange
    "#c38d22", // Warm Gold
    "#227c5d", // Deep Teal Green (adds balance)
    "#8c22c3", // Royal Violet (adds depth)
    "#c3225f"  // Deep Magenta Red (adds visual pop)
]


const chartData = forexData
    .map((item) => ({
        pair: item.pair,
        name: item.pair.replace("/USD", ""),
        value: item.trades,
        pnl: item.pnl,
        monthlyChange: item.monthlyChange
    }))
    .sort((a, b) => b.value - a.value)


// calculate total
const total = forexData.reduce((sum, item) => sum + item.trades, 0);


// Custom tool tip for pie chart
const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        console.log(payload)
        return (

            <div className='bg-[#3a3a3a] pl-1 pr-3 shadow-lg'>
                <p>{payload[0].name}</p>
                <p>{payload[0].value.toLocaleString('de-DE')} €</p>
                <p>{((payload[0].value / total) * 100).toFixed(2)}%</p>
            </div>
        )
    }
}


const CustomToolTipLine = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-[#3a3a3a] p-2 shadow-lg'>
                <p>Revenue: {payload[0].value.toLocaleString('de-DE')} €</p>
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
    const [showResult, setShowResult] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'from')
            setFromCurr(value);
        else if (name === 'to')
            setToCurr(value);
        else if (name === 'input')
            setFromValue(value);
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    }

    const filteredData = chartData.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    async function swapPairs() {
        let temp = fromCurr;
        setFromCurr(toCurr)
        setToCurr(temp)

        // call
        fetchDataWithCurrencies(toCurr, temp)
    }

    async function fetchData() {
        fetchDataWithCurrencies(fromCurr, toCurr)
    }

    async function fetchDataWithCurrencies(from, to) {
        const amount = fromValue > 1 ? fromValue : 1;

        try {
            const URL = `${base_URL}/${from}`
            const response = await fetch(URL);
            const data = await response.json()
            let amt = amount
            const rate = parseFloat(data.conversion_rates[to])
            amt = amt * rate
            setToValue(amt.toFixed(2))
            setShowResult(true)
        } catch (error) {
            alert("Error fetching conversion rate")
        }
    }


    return (
        <div className='flex flex-col'>
            <div className='min-h-screen bg-[#0d0d0d] text-white flex flex-row p-6 gap-8 pt-10'>
                <div className='flex flex-col w-1/2 gap-6'>
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
                            <div>
                                <p className='text-sm text-gray-400'>Today's PnL</p>
                                <p className='text-lg font-semibold text-green-400'>+ $450</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-400'>Total Asset Worth</p>
                                <p className='text-lg font-semibold text-blue-400'>$15,230</p>
                            </div>
                        </div>
                    </div>

                    {/* Line graph */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg flex flex-col'>
                        <h2 className='text-xl font-semibold mb-4 text-white'>
                            Forex Asset Trend
                        </h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={monthlyRevenueData}>
                                <XAxis dataKey="month" stroke="#aaa" interval={0} tick={{ fontSize: 12 }} padding={{ left: 20, right: 20 }} />
                                <YAxis stroke="#aaa" tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomToolTipLine />} />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2285c3"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                //activeDot={{ r: 6, fill: "#3a3a3a", stroke: "#3a3a3a" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                </div>
                <div className='flex flex-col gap-6 w-1/2'>

                    {/* currency converter */}
                    <div className='bg-[#181818] w-full p-6 rounded-2xl shadow-lg flex flex-col gap-3'>
                        <h1 className='text-lg font-semibold text-white'>Currency Converter</h1>

                        <div className='flex flex-col sm:flex-row gap-3 justify-center items-center'>
                            <input
                                name='input'
                                type='number'
                                placeholder='Amount'
                                className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/3'
                                onChange={handleChange}
                            />

                            <select name='from' value={fromCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4' onChange={handleChange}>{Object.keys(countryList).map((currency) =>
                                <option value={currency} className='text-black bg-[#ffffff]'>{currency}</option>)}
                            </select>

                            <span className='text-white cursor-pointer' onClick={swapPairs}><LuArrowRightLeft /></span>

                            <select name='to' value={toCurr} className='p-2 border-2 border-[#3a3a3a] rounded-md text-white w-full sm:w-1/4' onChange={handleChange}>{Object.keys(countryList).map((currency) =>
                                <option value={currency} className='text-black bg-[#ffffff]'>{currency}</option>)}
                            </select>

                            <button className='bg-[#2285c3] px-4 py-2 rounded-md text-white font-semibold hover:bg-[#1a6b9c] cursor-pointer' onClick={fetchData}>
                                Convert
                            </button>
                        </div>
                        {showResult && <div className='text-center'>{fromValue} {fromCurr} = {toValue} {toCurr}</div>}
                    </div>
                    <div className='flex flex-col gap-6 items-center justify-center bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <div className='relative w-full max-w-md'>
                            <ResponsiveContainer width="100%" height={330}>
                                <PieChart margin={{ top: 20, bottom: 20 }}>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={95}
                                        outerRadius={140}
                                        paddingAngle={0}
                                        dataKey="value"
                                        label={(entry) => entry.name}
                                        labelLine={false}
                                        stroke='none'
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index] || "#6B7280"}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomToolTip />} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* center text of doughnut chart */}
                            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center'>
                                <div className='text-white text-2xl font-semibold'>
                                    {total.toLocaleString('de-DE')} €
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-full max-w-6xl px-6">
                {/* search bar */}
                <div className='flex items-center justify-between mb-3'>
                    <div>
                        <h1 className='text-white font-semibold text-xl'>All Assets</h1>
                    </div>
                    <div className='flex items-center gap-3 bg-[#181818] p-2 rounded-md w-full sm:w-1/4'>
                        <LuSearch size={20} className='text-white' />
                        <input
                            type='text'
                            placeholder='Search Pairs'
                            value={searchQuery}
                            onChange={handleSearch}
                            spellCheck={false}
                            className='bg-transparent text-white w-full focus:outline-none placeholder-gray-400'
                        />
                    </div>

                </div>

                <div className='rounded-2xl overflow-hidden bg-[#181818] mt-6 mb-12 overflow-x-auto'>

                    <table className='w-full'>
                        <thead className='text-sm font-medium text-[#ababab] bg-[#1f1f1f]'>
                            <tr>
                                <th className='pl-10 py-2.5 px-4 text-left font-mono uppercase tracking-wide select-none'>Pair</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Trades Count</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>PnL</th>
                                <th className='pr-5 py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>% of trades</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(searchQuery ? filteredData : chartData).map((row, index) => (
                                <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                                    <td className='py-2.5 px-4 select-none'>
                                        <div className='flex items-center gap-3'>
                                            <div className='rounded-full h-3 w-3' style={{ background: COLORS[index] }}></div>
                                            <span>{row.pair}</span>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        {row.value}
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        <div className='flex items-center justify-end gap-2'>
                                            <span>{row.pnl}$</span>
                                            <span className={`px-1.5 py-0.5 rounded-md text-xs ${row.pnl > 0
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>{parseInt(row.monthlyChange) >= 0 ? '▲' : '▼'} {row.monthlyChange}% </span>
                                        </div>

                                    </td>
                                    <td className='py-3 px-4 pr-5 text-right select-none'>
                                        {((row.value / total) * 100).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

