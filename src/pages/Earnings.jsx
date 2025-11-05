import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useState } from 'react';
import { FaInfoCircle } from "react-icons/fa";
import { IoIosArrowRoundUp } from "react-icons/io";
import { motion } from 'framer-motion';
import data from '../data/earningsData';
import tableData from '../data/earningsTableData';


export default function Earnings()
{
    const [activeBar, setActiveBar] = useState(null)
    const [tooltopContent, setTooltipContent] = useState(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    const CustomLabel = (props) => {
        const { x, y, width, value, dataKey, index } = props;

        if (activeBar?.type === dataKey && activeBar?.index === index) {
            // Adjust x-position slightly for each bar type
            let xOffset = 0;
            if (dataKey === "Crypto") xOffset = -10;
            if (dataKey === "Stocks") xOffset = 0;
            if (dataKey === "Forex") xOffset = 10;

            return (
                <text
                    x={x + width / 2 + xOffset}
                    y={y - 5}
                    fill="white"
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={500}
                >
                    ${value}
                </text>
            );
        }
        return null;
    };


    function calculateYAxisTicks()
    {
        // Find max value from the data
        const maxValue = Math.max(
            ...data.flatMap(d => [d.Crypto, d.Stocks, d.Forex])
        )
        // Find min value from the data
        const minValue = Math.min(
            ...data.flatMap(d => [d.Crypto, d.Stocks, d.Forex])
        )

        const roughStep = (maxValue - minValue) / 5
        const step = Math.ceil(roughStep / 1000) * 1000;

        return [0, step, step * 2, step * 3, step * 4, step * 5]
    }

    function handleMouseOver(e, text)
    {
        console.log(e)
        const rect = e.target.getBoundingClientRect()  // gives the exact coordinates of hovered element (i)
        setTooltipPos({
            x: rect.left + rect.width / 2,  // horizontally center
            y: rect.top - 10   // slightly above
        })
        setTooltipContent(text)
    }

    function handleMouseLeave()
    {
        setTooltipContent(null);
    }


    return (
        <div className="flex bg-[#0d0d0d] pt-20 overflow-x-hidden w-full max-w-[100vw]">
            {/* navbar
            <div className="w-[240px] h-screen bg-yellow-400 mr-6"></div> */}   

            {/* Main content */}
            <div className="flex flex-col w-full m-4 gap-4">
                {/* {card container} */}
                <motion.div 
                initial = {{ opacity: 0, x: 50 }}
                whileInView = {{ opacity: 100, x: 0 }}
                transition = {{ duration: 0.6, delay: 0.1 }}
                viewport = {{ once: false }}
                className='grid sm:grid-cols-2 md:grid-cols-4 justify-center items-center gap-6'>
                    {/* {Card 1} */}
                    <div className='bg-[#181818] p-5 w-56 text-left rounded-2xl'>
                        <div className='text-xs text-[#ababab]'>Total Earnings (YTD)</div>
                        <div className='text-2xl text-white font-semibold'>$28,542</div>
                        <div className='flex items-center pt-1.5'>
                            <IoIosArrowRoundUp size = {20} className='text-green-400'/>
                            <div className='text-xs text-green-400'>24.5% Return</div>
                        </div>
                    </div>
                    <div className='bg-[#181818] p-5 w-56 text-left rounded-2xl'>
                        <div className='text-xs text-[#ababab]'>Best Month</div>
                        <div className='text-2xl text-white font-semibold'>June 2025</div>
                        <div className='text-xs text-green-400 pt-1.5'>+$5,234 (+8.2%)</div>
                    </div>
                    <div className='bg-[#181818] p-5 w-56 text-left rounded-2xl'>
                        <div className='text-xs text-[#ababab]'>Average Monthly</div>
                        <div className='text-2xl text-white font-semibold'>$2,878</div>
                        <div className='text-xs text-green-400 pt-1.5'>Consistent Growth</div>
                    </div>
                    <div className='bg-[#181818] p-5 w-56 text-left rounded-2xl'>
                        <div className='text-xs text-[#ababab]'>Best Asset Class</div>
                        <div className='text-2xl text-white font-semibold'>Crypto</div>
                        <div className='text-xs text-green-400 pt-1.5'>Top Performer</div>
                    </div>
                </motion.div>
                {/* Chart Section */}
                <div className='h-[400px] w-full rounded-2xl p-4 bg-[#181818] relative overflow-visible z-0 hidden sm:block'>
                    <ResponsiveContainer width="100%" height="95%"> 
                        <BarChart 
                            data={data}
                            margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                            barGap={-2}
                            barCategoryGap="20%"
                        >
                            <CartesianGrid 
                                strokeDasharray="0"
                                stroke="#333"
                                vertical={false}
                            />

                            <XAxis 
                                dataKey="month"
                                stroke="#999"
                                tick={{ fill: "white", fontSize: 12, dy: 6, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#999"
                                padding={{ top: 10 }}
                                tick={{ fill: "white", fontSize: 12, dx: -4, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                                ticks={calculateYAxisTicks()}
                                tickFormatter={(value) => value === 0 ? '0' : `${value / 1000}k`}
                            />

                            <Bar 
                                dataKey="Crypto"
                                fill="#2dd4bf"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={7}
                                isAnimationActive={false}
                                onMouseOver={(_, index) => setActiveBar({ type: 'Crypto', index })}
                                onMouseOut={() => setActiveBar(null)}
                                label={<CustomLabel dataKey="Crypto" />}
                            />
                            <Bar 
                                dataKey="Stocks"
                                fill="#3b82f6"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={7}
                                isAnimationActive={false}
                                onMouseOver={(_, index) => setActiveBar({ type: 'Stocks', index })}
                                onMouseOut={() => setActiveBar(null)}
                                label={<CustomLabel dataKey="Stocks" />}
                            />
                            <Bar 
                                dataKey="Forex"
                                fill="#fbbf34"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={7}
                                isAnimationActive={false}
                                onMouseOver={(_, index) => setActiveBar({ type: 'Forex', index })}
                                onMouseOut={() => setActiveBar(null)}
                                label={<CustomLabel dataKey="Forex" />}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Table Section */}
                <div className='rounded-2xl overflow-hidden bg-[#181818] relative z-[9999] mt-6 overflow-x-auto'>
                    <table className='w-full'>
                        <thead className='text-sm font-medium text-[#ababab] bg-[#1f1f1f]'> 
                            <tr>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>Source</th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>
                                    <div className='flex justify-end items-center gap-1.5'>
                                        <div>Total Source Volume</div>
                                        <FaInfoCircle size = {12} onMouseOver={(e) => handleMouseOver(e, "Total volume of this source over all exchanges.")} onMouseLeave={handleMouseLeave} className='cursor-pointer'/>
                                    </div>
                                </th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>
                                    <div className='flex justify-end items-center gap-1.5'>
                                        <div>% Of Total Volume</div>
                                        <FaInfoCircle size = {12} onMouseOver={(e) => handleMouseOver(e, "Percentage volume of this source with respect to other classes.")} onMouseLeave={handleMouseLeave} className='cursor-pointer'/>
                                    </div>
                                </th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>
                                    <div className='flex justify-end items-center gap-1.5'>
                                        <div>Avg. Monthly Growth</div>
                                        <FaInfoCircle size = {12} onMouseOver={(e) => handleMouseOver(e, "Average increase or decrease in earnings per month.")} onMouseLeave={handleMouseLeave} className='cursor-pointer' />
                                    </div>
                                </th>
                                <th className='py-2.5 px-4 text-right font-mono uppercase tracking-wide select-none'>
                                    <div className='flex justify-end items-center gap-1.5'>
                                        <div>Avg. Yearly Growth</div>
                                        <FaInfoCircle size = {12} onMouseOver={(e) => handleMouseOver(e, "Average increase or decrease in earnings per year.")} onMouseLeave={handleMouseLeave} className='cursor-pointer' />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row, index) => (
                                <tr key = {index} className='text-sm text-white border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#202020]'>
                                    <td className='py-2.5 px-4 select-none'>
                                        <div className='flex items-center gap-3'>
                                            <div className = 'rounded-full h-3 w-3' style = {{ background: row.color }}></div>
                                            <span>{row.source}</span>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        {row.totalVolume}
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        {row.percentVolume}
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        <div className='flex items-center justify-end gap-2'>
                                            <span>{row.avgMonthly} $</span>
                                            <span className = {`px-1.5 py-0.5 rounded-md text-xs ${
                                                parseInt(row.avgMonthly) >= 0 
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>{parseInt(row.avgMonthly) >= 0 ? '▲' : '▼'} {row.monthlyChange}% </span>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 text-right select-none'>
                                        <div className='flex items-center justify-end gap-2'>
                                            <span>{row.avgYearly} $</span>
                                            <span className = {`px-1.5 py-0.5 rounded-md text-xs ${
                                                parseInt(row.avgYearly) >= 0
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                            }`}>{parseInt(row.avgYearly) >= 0 ? '▲' : '▼'} {row.yearlyChange}% </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {tooltopContent && (
                <div
                    className={`fixed bg-[#3e3e3e] text-white text-xs px-3 py-2 rounded-md shadow-lg z-[99999] pointer-events-none transition-all duration-150`}
                    style={{
                    top: tooltipPos.y,
                    left: tooltipPos.x,
                    transform: "translate(-50%, -100%)",
                    }}
                >{tooltopContent}</div>
            )}
        </div>
    )
}