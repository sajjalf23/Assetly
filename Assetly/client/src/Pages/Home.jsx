import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AppContext } from '../context/appContext';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { LuWallet, LuTrendingUp, LuTrendingDown, LuCpu, LuGlobe, LuShieldCheck } from 'react-icons/lu';
import { formatChange } from '../utils/formatChange';
import API from '../Api/axios';



export default function Home() {
    const { userData, BackendUrl } = useContext(AppContext);
    const [stats, setStats] = useState(null);
    const [homeData, setHomeData] = useState(null);

    const total = stats?.balances?.total || 1;

    const sectors = [
        {
            name: "Cryptocurrency",
            amount: stats?.balances?.crypto || 0,
            percentage: ((stats?.balances?.crypto || 0) / total * 100).toFixed(1),
            color: "bg-[#8b5cf6]",
            icon: <LuCpu />
        },
        {
            name: "Forex Markets",
            amount: stats?.balances?.forex || 0,
            percentage: ((stats?.balances?.forex || 0) / total * 100).toFixed(1),
            color: "bg-[#fbbf34]",
            icon: <LuGlobe />
        },
        {
            name: "Stocks",
            amount: stats?.balances?.stocks || 0,
            percentage: ((stats?.balances?.stocks || 0) / total * 100).toFixed(1),
            color: "bg-[#3b82f6]",
            icon: <LuWallet />
        }
    ];

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        // axios.get(`${backendUrl}/api/home/page`, { withCredentials: true })
        const fetchHomeData = async () => {
            try {
                const { data } = await API.get("/api/home/page");

                if (data.success) {
                    setHomeData(data.history);
                    setStats(data);
                }
            } catch (err) {
                console.log(err);
            }
        };

        fetchHomeData();
    }, []);

    return (
        <div className="bg-[#0d0d0d] min-h-screen pt-10 text-white w-full overflow-x-hidden">
            <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">

                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1"
                >
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome Back, {userData?.name || 'Investor'}
                    </h1>
                    <p className="text-sm text-[#ababab]">
                        Here is a bird's-eye view of your unified asset portfolio today.
                    </p>
                </motion.div>

                {/* Main Row: Net Worth Analytics & Quick Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Big Net Worth Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2 bg-[#181818] p-6 rounded-2xl border border-[#2a2a2a] flex flex-col justify-between"
                    >
                        <div>
                            <p className="text-xs font-mono uppercase tracking-widest text-[#ababab]">Estimated Net Worth</p>
                            <div className="flex items-baseline gap-3 mt-1">
                                <h2 className="text-4xl font-extrabold text-white">
                                    ${stats?.balances?.total?.toLocaleString(undefined, {
                                        minimumFractionDigits: 2
                                    }) || "0.00"}
                                </h2>
                                {(stats?.monthlyChange ?? 0) !== 0 && (
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1
    ${(stats?.monthlyChange ?? 0) > 0
                                                ? "text-green-400 bg-green-500/10"
                                                : "text-red-400 bg-red-500/10"
                                            }`}
                                    >
                                        {(stats?.monthlyChange ?? 0) > 0
                                            ? <LuTrendingUp size={12} />
                                            : <LuTrendingDown size={12} />
                                        }

                                        {formatChange(stats.monthlyChange)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Chart Preview */}
                        <div className="h-44 w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={homeData || []}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#525252" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#202020', borderColor: '#2a2a2a', borderRadius: '8px' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Sector Allocation Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#181818] p-6 rounded-2xl border border-[#2a2a2a] flex flex-col justify-between"
                    >
                        <h3 className="text-base font-semibold mb-4">Asset Sectors</h3>
                        <div className="space-y-4 flex-grow flex flex-col justify-center">
                            {sectors.map((sector, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium">
                                        <div className="flex items-center gap-2 text-[#ababab]">
                                            <span className={`p-1 rounded text-white ${sector.color}`}>
                                                {sector.icon}
                                            </span>
                                            {sector.name}
                                        </div>

                                        <span className="text-white">
                                            ${sector.amount.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })} ({sector.percentage}%)
                                        </span>
                                    </div>

                                    <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${sector.color}`}
                                            style={{ width: `${sector.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Actionable Bottom Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] flex items-center gap-4 hover:bg-[#1f1f1f]">
                        <div className="p-3 bg-green-500/10 text-green-400 rounded-xl">
                            <LuShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-[#ababab] font-medium">API Core Status</p>
                            <h4 className="text-sm font-semibold text-white mt-0.5">{
                                stats?.integrations?.allActive
                                    ? "All Integrations Active"
                                    : `${stats?.integrations?.inactive || 0} Integration${(stats?.integrations?.inactive || 0) !== 1 ? "s" : ""} Inactive`
                            }</h4>
                        </div>
                    </div>

                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] flex items-center gap-4 hover:bg-[#1f1f1f]">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                            <LuWallet size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-[#ababab] font-medium">Connected Modules</p>
                            <h4 className="text-sm font-semibold text-white mt-0.5">
                                {
                                    `${stats?.integrations?.active || 0} of ${stats?.integrations?.connected || 0} Active`
                                }
                            </h4>
                        </div>
                    </div>

                    <div className="bg-[#181818] p-5 rounded-xl border border-[#2a2a2a] flex items-center gap-4 hover:bg-[#1f1f1f]">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                            <LuTrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-[#ababab] font-medium">Top Performer</p>
                            <h4 className="text-sm font-semibold text-white mt-0.5">
                                {
                                    stats?.top_performer_24h
                                        ? `${stats.top_performer_24h.name} (${stats.top_performer_24h.symbol.toUpperCase()}) +${stats.top_performer_24h.price_change_percentage_24h.toFixed(2)}%`
                                        : "No data available"
                                }
                            </h4>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}