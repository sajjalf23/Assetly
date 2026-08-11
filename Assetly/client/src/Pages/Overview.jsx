import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { IoIosArrowRoundUp } from "react-icons/io";
import { FaCalendarAlt } from "react-icons/fa";
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
import { format, startOfWeek, endOfWeek, subDays, startOfMonth, subMonths, startOfYear } from "date-fns";

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pieChartDate, setPieChartDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch controller data on load
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        // Replace with your actual backend endpoint route if different
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/overview`, {
          headers: {
            // Include auth header if required by your application context
            Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          },
        });
        const result = await res.json();
        console.log("OVERVIEW API RESPONSE:", result);
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to fetch overview");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Dynamic calculations for Pie chart based on fetched current balance or distribution
  const { pieData, pieChartStats, pieTimeRangeLabel } = useMemo(() => {
    const defaultDistribution = data?.distribution || [
      { name: "Crypto", value: 0, color: "#2dd4bf" },
      { name: "Stocks", value: 0, color: "#3b82f6" },
      { name: "Forex", value: 0, color: "#fbbf24" },
    ];

    const totalEarnings = defaultDistribution.reduce((acc, item) => acc + item.value, 0);

    const bestPerformer = defaultDistribution.reduce(
      (max, item) => (item.value > max.value ? item : max),
      defaultDistribution[0]
    );

    const weekStart = startOfWeek(pieChartDate);
    const weekEnd = endOfWeek(pieChartDate);
    const timeRangeLabel = `Week of ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

    return {
      pieData: defaultDistribution,
      pieChartStats: {
        totalEarnings,
        bestPerformer: bestPerformer?.name || "N/A",
      },
      pieTimeRangeLabel: timeRangeLabel,
    };
  }, [data, pieChartDate]);

  const handlePieChartDateChange = (newDate) => {
    setPieChartDate(newDate);
  };

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

    setPieChartDate(newDate);
  };

  const toggleCalendar = () => setShowCalendar(!showCalendar);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d] text-white">
        Loading portfolio overview...
      </div>
    );
  }

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
  const previousTotal = stats.previousMonthTotal || 0;

  let trendText = "No history";
  let trendColor = "text-gray-400";
  let trendIcon = null;

  const hasAssets =
    balances.crypto > 0 ||
    balances.stocks > 0 ||
    balances.forex > 0;

  if (previousTotal > 0) {
    const percent = (
      ((currentTotal - previousTotal) / previousTotal) *
      100
    ).toFixed(1);

    if (currentTotal > previousTotal) {
      trendText = `+${percent}%`;
      trendColor = "text-green-400";
      trendIcon = (
        <IoIosArrowRoundUp
          size={20}
          className="text-green-400"
        />
      );
    }

    else if (currentTotal < previousTotal) {
      trendText = `${percent}%`;
      trendColor = "text-red-400";
      trendIcon = (
        <IoIosArrowRoundUp
          size={20}
          className="rotate-180 text-red-400"
        />
      );
    }

    else {
      trendText = "0%";
      trendColor = "text-gray-400";
    }
  }

  const calendarStyles = `
    .react-calendar { background-color: transparent !important; color: white !important; width: 100% !important; border: none !important; }
    .react-calendar__navigation { color: white !important; }
    .react-calendar__navigation button { color: white !important; font-weight: 600; background: transparent !important; border: none !important; }
    .react-calendar__navigation button:hover, .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus { background-color: #374151 !important; }
    .react-calendar__tile { color: white !important; background: transparent !important; border: none !important; }
    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #374151 !important; }
    .react-calendar__tile:disabled { color: #666 !important; }
    .react-calendar__tile--now { background-color: #3b82f6 !important; color: white !important; }
    .react-calendar__tile--active { background-color: #10b981 !important; color: white !important; }
    .react-calendar__month-view__weekdays { color: #d1d5db !important; font-weight: 500; text-decoration: none !important; }
    .react-calendar__month-view__weekdays__weekday { color: #d1d5db !important; }
    .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; border: none !important; }
    .react-calendar__month-view__days__day--weekend { color: white !important; }
    .react-calendar__month-view__days__day--neighboringMonth { color: #666 !important; }
  `;

  const PieCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = pieChartStats.totalEarnings;
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-gray-700 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
            <p className="font-semibold text-white text-sm">{payload[0].name}</p>
          </div>
          <p className="text-lg font-bold text-[#2dd4bf]">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : 0}% of portfolio
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
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
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

  return (
    <div className="flex flex-col bg-[#0d0d0d] pt-15 pb-15 px-4 md:px-6 min-h-screen gap-6 md:gap-8">
      <style>{calendarStyles}</style>

      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Portfolio Overview</h1>
        <div className="text-sm text-gray-400">
          Current Month: <span className="font-semibold text-white">{format(new Date(), "MMMM yyyy")}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[
          {
            title: "Total Portfolio Worth",
            value: formatCurrency(currentTotal),
            change: trendText,
            icon: trendIcon,
            changeColor: trendColor,
          },
          {
            title: "Best Snapshot Month",
            value: stats.bestMonth || "N/A",
            change:
              stats.bestMonthValue > 0
                ? formatCurrency(stats.bestMonthValue)
                : "No snapshots",
            changeColor:
              stats.bestMonthValue > 0
                ? "text-green-400"
                : "text-gray-400",
          },
          {
            title: "Monthly Average",
            value: formatCurrency(stats.average),
            change:
              stats.average > 0
                ? "Across all months"
                : "No history",

            changeColor:
              stats.average > 0
                ? "text-blue-400"
                : "text-gray-400",
          },
          {
            title: "Best Asset Class",
            value: hasAssets ? stats.bestAsset : "N/A",
            change: hasAssets ? "Largest Holding" : "No assets",
            changeColor: hasAssets ? "text-blue-400" : "text-gray-400",
          },
        ].map((widget, index) => (
          <div
            key={index}
            className="bg-[#181818] p-4 md:p-6 text-left rounded-xl md:rounded-2xl hover:bg-[#1f1f1f] transition-colors duration-200 border border-gray-800"
          >
            <div className="text-xs text-gray-400 mb-1">{widget.title}</div>
            <div className="text-xl md:text-2xl text-white font-bold mb-2">{widget.value}</div>
            <div className={`flex items-center ${widget.icon ? "gap-1" : ""}`}>
              {widget.icon && widget.icon}
              <div className={`text-xs font-medium ${widget.changeColor}`}>{widget.change}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Pie Chart Section */}
      <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center border border-gray-800">
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-white text-lg font-semibold">Portfolio Distribution</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400 bg-gray-900/50 px-3 py-1 rounded-lg">
              {pieTimeRangeLabel}
            </div>
            <button
              onClick={toggleCalendar}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm cursor-pointer"
              title="Select date for pie chart"
            >
              <FaCalendarAlt />
            </button>
          </div>
        </div>

        <div className="h-75 w-full min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                innerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieCustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium text-white">{item.name}</span>
              <span className="text-xs text-gray-400 ml-1">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic Pie Chart Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total Assets Value</div>
            <div className="text-lg font-bold text-white">{formatCurrency(pieChartStats.totalEarnings)}</div>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Best Performer</div>
            <div className="text-lg font-bold text-white">{pieChartStats.bestPerformer}</div>
          </div>
        </div>
      </div>

      {/* Monthly Line Graph - Dynamic Snapshots */}
      <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">
            Historical Portfolio Performance
          </h3>
          <div className="text-sm text-gray-400">
            Total Worth: <span className="font-bold text-green-400">{formatCurrency(balances.total)}</span>
          </div>
        </div>
        <div className="h-72 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={graphData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
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
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip content={<LineCustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px", color: "#ccc" }} />
              <Line
                type="monotone"
                dataKey="Crypto"
                name="Crypto"
                stroke="#2dd4bf"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Stocks"
                name="Stocks"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Forex"
                name="Forex"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) toggleCalendar();
          }}
        >
          <motion.div
            className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 w-full max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">Select Date Range</h3>
              <button onClick={toggleCalendar} className="text-gray-400 hover:text-white text-lg">
                ✕
              </button>
            </div>

            <div className="bg-[#0d0d0d] rounded-lg p-3 border border-gray-700">
              <Calendar
                onChange={handlePieChartDateChange}
                value={pieChartDate}
                className="!bg-transparent !border-0 !text-white"
                next2Label={null}
                prev2Label={null}
                formatMonthYear={(locale, date) => format(date, "MMMM yyyy")}
                formatShortWeekday={(locale, date) => ["S", "M", "T", "W", "T", "F", "S"][date.getDay()]}
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4 mt-4">
              {["This Week", "Last Week", "This Month", "Last Month", "This Year"].map((option) => (
                <button
                  key={option}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
                  onClick={() => {
                    handleQuickSelect(option.toLowerCase().replace(" ", ""));
                    toggleCalendar();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-gray-300 text-sm">
                Selected date:{" "}
                <span className="font-semibold text-white">
                  {format(pieChartDate, "EEEE, MMMM d, yyyy")}
                </span>
              </p>
              <div className="flex justify-between mt-2">
                <button
                  onClick={toggleCalendar}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={toggleCalendar}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}