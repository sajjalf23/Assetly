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
import { LuSearch } from "react-icons/lu";

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
                <p>Units: {payload[0].value.toLocaleString('de-DE')}</p>
            </div>
        );
    }
    return null;
};

export default function Stocks() {

    const [searchQuery, setSearchQuery] = useState("");

    // Backend data
    const [chartData, setChartData] = useState([]);
    const [total, setTotal] = useState(0);

    // Fetch backend trades
    const fetchBackendData = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/stocks/trades');
            const data = await res.json();
            console.log("Frontend", data)

            const tradesArray = Array.isArray(data.orders) ? data.orders : [];

            const symbolMap = {}

            tradesArray.forEach(order => {
              if (order.status !== "FILLED") return;

              if(!symbolMap[order.symbol]) {
                symbolMap[order.symbol] = {
                  pair: order.symbol,
                  name: order.symbol,
                  value: 0,
                  pnl: 0
                }
              }

              symbolMap[order.symbol].value += order.quantity
              symbolMap[order.symbol].pnl += order.quantity * order.averageFilledPrice
            });

            const mappedData = Object.values(symbolMap).sort(
              (a, b) => b.value - a.value
            )

            const totalUnits = mappedData.reduce((sum, item) => sum + item.value, 0);
            setTotal(totalUnits);
            setChartData(mappedData);

        } catch (err) {
            console.error("Error fetching backend data:", err);
        }
    };

    useEffect(() => {
        fetchBackendData();
    }, []);

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const filteredData = chartData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayData = searchQuery ? filteredData : chartData;

    return (
        <div className='flex flex-col'>
            <div className='min-h-screen bg-[#0d0d0d] text-white flex flex-row p-6 gap-8 pt-10'>
                <div className='flex flex-col w-1/2 gap-6'>
                    {/* Market Overview */}
                    <div className='bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <h1 className='text-lg font-bold'>Portfolio Overview</h1>
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
                        <h2 className='text-xl font-semibold mb-4 text-white'>
                            Forex Asset Trend
                        </h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={displayData}>
                                <XAxis dataKey="name" stroke="#aaa" />
                                <YAxis stroke="#aaa" />
                                <Tooltip content={<CustomToolTipLine />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#2285c3"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie chart */}
                <div className='flex flex-col gap-6 w-1/2'>
                    <div className='flex flex-col items-center justify-center bg-[#181818] p-6 rounded-2xl shadow-lg'>
                        <div className='relative w-full max-w-md'>
                            <ResponsiveContainer width="100%" height={415}>
                                <PieChart>
                                    <Pie
                                        data={displayData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={95}
                                        outerRadius={140}
                                        dataKey="value"
                                        label={(entry) => entry.name}
                                        labelLine={false}
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
                                    {total.toLocaleString('de-DE')} €
                                </div>
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
                            {displayData.map((row, index) => (
                                <tr key={index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                                    <td className='px-4 py-2.5 select-none'>
                                      <div className='flex items-center gap-3'>
                                            <div className='rounded-full h-3 w-3' style={{ background: COLORS[index] }}></div>
                                            <span>{row.pair}</span>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>{row.value}</td>
                                    <td className='py-3 px-4 text-right select-none'>{row.pnl.toFixed(2)}</td>
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
    );
}
