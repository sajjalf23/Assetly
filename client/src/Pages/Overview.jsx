import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { FaCalendarAlt } from "react-icons/fa";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  format,
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  subMonths,
  startOfYear,
} from "date-fns";
import API from "../Api/axios";


const DEFAULT_DISTRIBUTION = [
  { name: "Crypto", value: 0, color: "#2dd4bf" },
  { name: "Stocks", value: 0, color: "#3b82f6" },
  { name: "Forex", value: 0, color: "#fbbf24" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pieChartDate, setPieChartDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch overview data with AbortController to prevent race conditions
  const fetchOverview = useCallback(async (selectedDate, signal) => {
    try {
      setLoading(true);
      setError(null);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const { data: result } = await API.get(`/api/overview`, {
        params: { date: formattedDate },
        signal,
      });

      if (result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to fetch overview");
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOverview(pieChartDate, controller.signal);
    return () => controller.abort();
  }, [pieChartDate, fetchOverview]);

  // Derived state calculations
  const { pieData, pieChartStats, pieTimeRangeLabel } = useMemo(() => {
    const distribution = data?.distribution?.length
      ? data.distribution
      : DEFAULT_DISTRIBUTION;

    const totalEarnings = distribution.reduce(
      (acc, item) => acc + (item.value || 0),
      0
    );

    const initialItem = distribution[0] || { name: "N/A", value: 0 };
    const bestPerformer = distribution.reduce(
      (max, item) => (item.value > max.value ? item : max),
      initialItem
    );

    const weekStart = startOfWeek(pieChartDate);
    const weekEnd = endOfWeek(pieChartDate);
    const timeRangeLabel = `Week of ${format(weekStart, "MMM d")} - ${format(
      weekEnd,
      "MMM d, yyyy"
    )}`;

    return {
      pieData: distribution,
      pieChartStats: {
        totalEarnings,
        bestPerformer: bestPerformer?.value > 0 ? bestPerformer.name : "N/A",
      },
      pieTimeRangeLabel: timeRangeLabel,
    };
  }, [data, pieChartDate]);

  const { trendText, trendColor, trendIcon } = useMemo(() => {
    const currentTotal = data?.balances?.total || 0;
    const previousTotal = data?.stats?.previousMonthTotal || 0;

    if (!previousTotal || previousTotal === 0) {
      return {
        trendText: "No history",
        trendColor: "text-gray-400",
        trendIcon: null,
      };
    }

    const diff = currentTotal - previousTotal;
    const rawPercent = ((diff / previousTotal) * 100).toFixed(1);
    const absPercent = Math.abs(rawPercent);

    if (diff > 0) {
      return {
        trendText: `+${absPercent}%`,
        trendColor: "text-green-400",
        trendIcon: <LuTrendingUp size={20} className="text-green-400" />,
      };
    } else if (diff < 0) {
      return {
        trendText: `-${absPercent}%`,
        trendColor: "text-red-400",
        trendIcon: <LuTrendingDown size={20} className="text-red-400" />,
      };
    }

    return {
      trendText: "0%",
      trendColor: "text-gray-400",
      trendIcon: null,
    };
  }, [data]);

  const handleQuickSelect = (option) => {
    const today = new Date();
    let newDate = today;

    switch (option) {
      case "thisweek":
        newDate = startOfWeek(today);
        break;
      case "lastweek":
        newDate = startOfWeek(subDays(today, 7));
        break;
      case "thismonth":
        newDate = startOfMonth(today);
        break;
      case "lastmonth":
        newDate = startOfMonth(subMonths(today, 1));
        break;
      case "thisyear":
        newDate = startOfYear(today);
        break;
      default:
        newDate = today;
    }

    setTempDate(newDate);
  };

  const handleOpenCalendar = () => {
    setTempDate(pieChartDate);
    setShowCalendar(true);
  };

  const handleApplyDate = () => {
    setPieChartDate(tempDate);
    setShowCalendar(false);
  };

  const handleCancelDate = () => {
    setShowCalendar(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d] text-red-400">
        Error loading overview: {error}
      </div>
    );
  }

  const balances = data?.balances || { total: 0 };
  const graphData = data?.graph || [];
  const stats = data?.stats || {};
  const currentTotal = balances.total || 0;
  const hasAssets =
    balances.crypto > 0 || balances.stocks > 0 || balances.forex > 0;

  const statWidgets = [
    {
      id: "total_worth",
      title: "Total Portfolio Worth",
      value: formatCurrency(currentTotal),
      change: trendText,
      icon: trendIcon,
      changeColor: trendColor,
    },
    {
      id: "best_month",
      title: "Best Snapshot Month",
      value: stats.bestMonth || "N/A",
      change:
        stats.bestMonthValue > 0
          ? formatCurrency(stats.bestMonthValue)
          : "No snapshots",
      icon:
        stats.bestMonthValue > 0 ? (
          <LuTrendingUp size={20} className="text-green-400" />
        ) : null,
      changeColor:
        stats.bestMonthValue > 0 ? "text-green-400" : "text-gray-400",
    },
    {
      id: "monthly_avg",
      title: "Monthly Average",
      value: formatCurrency(stats.average),
      change: stats.average > 0 ? "Across all months" : "No history",
      icon: null,
      changeColor: stats.average > 0 ? "text-blue-400" : "text-gray-400",
    },
    {
      id: "best_asset",
      title: "Best Asset Class",
      value: hasAssets ? stats.bestAsset : "N/A",
      change: hasAssets ? "Largest Holding" : "No assets",
      icon: null,
      changeColor: hasAssets ? "text-blue-400" : "text-gray-400",
    },
  ];

  return (
    <SkeletonTheme baseColor="#181818" highlightColor="#2a2a2a">
      <div className="flex flex-col bg-[#0d0d0d] pt-15 pb-15 px-4 md:px-6 min-h-screen gap-6 md:gap-8">
        {/* Title Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold">
            Portfolio Overview
          </h1>
          <div className="text-sm text-gray-400">
            Current Month:{" "}
            <span className="font-semibold text-white">
              {format(new Date(), "MMMM yyyy")}
            </span>
          </div>
        </div>

        {/* Stats Cards Skeleton / Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {["s1", "s2", "s3", "s4"].map((id) => (
              <div
                key={id}
                className="bg-[#181818] p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-800"
              >
                <Skeleton width={110} height={12} className="mb-2" />
                <Skeleton width={140} height={24} className="mb-2" />
                <Skeleton width={90} height={12} />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {statWidgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-[#181818] p-4 md:p-6 text-left rounded-xl md:rounded-2xl hover:bg-[#1f1f1f] transition-colors duration-200 border border-gray-800"
              >
                <div className="text-xs text-gray-400 mb-1">
                  {widget.title}
                </div>
                <div className="text-xl md:text-2xl text-white font-bold mb-2">
                  {widget.value}
                </div>
                <div
                  className={`flex items-center ${widget.icon ? "gap-1" : ""
                    }`}
                >
                  {widget.icon}
                  <div
                    className={`text-xs font-medium ${widget.changeColor}`}
                  >
                    {widget.change}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Pie Chart Section Skeleton / Content */}
        <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center border border-gray-800">
          <div className="flex justify-between items-center w-full mb-4">
            <h3 className="text-white text-lg font-semibold">
              Portfolio Distribution
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400 bg-gray-900/50 px-3 py-1 rounded-lg">
                {loading ? (
                  <Skeleton width={140} height={14} />
                ) : (
                  pieTimeRangeLabel
                )}
              </div>
              <button
                onClick={handleOpenCalendar}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer"
                title="Select date for pie chart"
              >
                <FaCalendarAlt />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="h-75 flex items-center justify-center">
                <Skeleton circle width={220} height={220} />
              </div>
              <div className="flex justify-center gap-3">
                <Skeleton width={80} height={28} borderRadius={8} />
                <Skeleton width={80} height={28} borderRadius={8} />
                <Skeleton width={80} height={28} borderRadius={8} />
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-2">
                <Skeleton height={56} borderRadius={8} />
                <Skeleton height={56} borderRadius={8} />
              </div>
            </div>
          ) : (
            <>
              <div className="h-75 w-full min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      innerRadius={80}
                      label={({ percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieCustomTooltip total={pieChartStats.totalEarnings} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-white">
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">
                    Total Assets Value
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(pieChartStats.totalEarnings)}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">
                    Best Performer
                  </div>
                  <div className="text-lg font-bold text-white">
                    {pieChartStats.bestPerformer}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Historical Line Chart Skeleton / Content */}
        <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-semibold">
              Historical Portfolio Performance
            </h3>
            <div className="text-sm text-gray-400">
              Total Worth:{" "}
              <span className="font-bold text-green-400">
                {loading ? (
                  <Skeleton width={60} inline />
                ) : (
                  formatCurrency(balances.total)
                )}
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-72 w-full pt-4">
              <Skeleton height="100%" borderRadius={12} />
            </div>
          ) : (
            <div className="h-72 min-h-[288px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart
                  data={graphData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    stroke="#333"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#666"
                    tick={{ fill: "#ccc", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: "#ccc", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip content={<LineCustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px", color: "#ccc" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Crypto"
                    stroke="#2dd4bf"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stocks"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Forex"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Date Selection Modal */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) handleCancelDate();
              }}
            >
              <motion.div
                className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 w-full max-w-md mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-lg font-semibold">
                    Select Date Range
                  </h3>
                  <button
                    onClick={handleCancelDate}
                    className="text-gray-400 hover:text-white text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#0d0d0d] rounded-lg p-3 border border-gray-700">
                  <Calendar
                    onChange={setTempDate}
                    value={tempDate}
                    className="!bg-transparent !border-0 !text-white"
                    next2Label={null}
                    prev2Label={null}
                    formatMonthYear={(_, date) => format(date, "MMMM yyyy")}
                    formatShortWeekday={(_, date) =>
                      ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-4 mt-4">
                  {[
                    "This Week",
                    "Last Week",
                    "This Month",
                    "Last Month",
                    "This Year",
                  ].map((option) => (
                    <button
                      key={option}
                      className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-700 cursor-pointer"
                      onClick={() =>
                        handleQuickSelect(
                          option.toLowerCase().replace(/\s+/g, "")
                        )
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <p className="text-gray-300 text-sm">
                    Selected date:{" "}
                    <span className="font-semibold text-white">
                      {format(tempDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </p>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={handleCancelDate}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyDate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SkeletonTheme>
  );
}

// Tooltip Components
const PieCustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <p className="font-semibold text-white text-sm">{item.name}</p>
        </div>
        <p className="text-lg font-bold text-[#2dd4bf]">
          {formatCurrency(item.value)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}% of
          portfolio
        </p>
      </div>
    );
  }
  return null;
};

const LineCustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 shadow-2xl">
        <p className="font-bold text-white mb-2 text-sm">{label}</p>
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center gap-2 mb-1 last:mb-0"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm font-medium text-gray-300">{entry.name}:</p>
            <p className="text-sm font-semibold text-white ml-auto">
              {formatCurrency(entry.value)}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};