import { motion } from 'framer-motion';
import { IoIosArrowRoundUp } from "react-icons/io";
import { FaCalendarAlt } from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState, useMemo } from "react";
import { 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  subDays, 
  subMonths, 
  getMonth,
  getYear,
  format,
  endOfWeek,
  endOfMonth,
  eachDayOfInterval
} from 'date-fns';

// Daily dataset with dates like 1 Oct, 2 Oct, etc.
const generateDailyData = (startDate, endDate) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.map((date, index) => ({
    date: format(date, 'd MMM'),
    dayIndex: index,
    Crypto: 1000 + (index * 200) + Math.floor(Math.random() * 300),
    Stocks: 500 + (index * 100) + Math.floor(Math.random() * 150),
    Forex: 300 + (index * 50) + Math.floor(Math.random() * 100)
  }));
};

export default function Overview() {
  const [pieChartDate, setPieChartDate] = useState(new Date()); // Date for pie chart only
  const [currentMonthDate] = useState(new Date()); // Always current month for other data
  const [showCalendar, setShowCalendar] = useState(false); // Calendar for pie chart only

  // Calculate PIE CHART data based on selected date
  const { pieData, pieChartStats, pieTimeRangeLabel } = useMemo(() => {
    // Generate daily data for the selected week (7 days including selected date)
    const weekStart = startOfWeek(pieChartDate);
    const weekEnd = endOfWeek(pieChartDate);
    const dailyDataForWeek = generateDailyData(weekStart, weekEnd);
    
    // Calculate totals from daily data
    const cryptoTotal = dailyDataForWeek.reduce((acc, item) => acc + item.Crypto, 0);
    const stocksTotal = dailyDataForWeek.reduce((acc, item) => acc + item.Stocks, 0);
    const forexTotal = dailyDataForWeek.reduce((acc, item) => acc + item.Forex, 0);
    const totalEarnings = cryptoTotal + stocksTotal + forexTotal;
    
    // Create pie data
    const pieData = [
      { name: 'Crypto', value: cryptoTotal, color: '#2dd4bf' },
      { name: 'Stocks', value: stocksTotal, color: '#3b82f6' },
      { name: 'Forex', value: forexTotal, color: '#fbbf24' },
    ];
    
    // Calculate stats for pie chart
    const bestPerformer = pieData.reduce((max, item) => 
      item.value > max.value ? item : max
    );
    
    const averageValue = totalEarnings / dailyDataForWeek.length;
    
    // Determine best day
    let bestDay = '';
    let bestDayValue = 0;
    
    if (dailyDataForWeek.length > 0) {
      const bestEntry = dailyDataForWeek.reduce((max, item) => {
        const total = item.Crypto + item.Stocks + item.Forex;
        return total > max.total ? { ...item, total } : max;
      }, { total: 0 });
      
      bestDay = bestEntry.date;
      bestDayValue = bestEntry.total;
    }
    
    // Time range label for pie chart
    const timeRangeLabel = `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    
    return {
      pieData,
      pieChartStats: {
        totalEarnings,
        averageValue,
        bestPerformer: bestPerformer.name,
        bestDay,
        bestDayValue,
        changePercentage: '8.5%'
      },
      pieTimeRangeLabel: timeRangeLabel
    };
  }, [pieChartDate]);

  // Calculate WEEKLY LINE CHART data based on CURRENT MONTH
  const { lineData, stats, timeRangeLabel } = useMemo(() => {
    const currentMonth = getMonth(currentMonthDate);
    const currentYear = getYear(currentMonthDate);
    
    // Generate daily data for current month
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(currentMonthDate);
    const dailyDataForMonth = generateDailyData(monthStart, monthEnd);
    
    // Group by weeks for line chart (Weekly data)
    const weeklyData = [];
    for (let i = 0; i < dailyDataForMonth.length; i += 7) {
      const weekData = dailyDataForMonth.slice(i, i + 7);
      const weekNumber = Math.floor(i / 7) + 1;
      const cryptoTotal = weekData.reduce((acc, item) => acc + item.Crypto, 0);
      const stocksTotal = weekData.reduce((acc, item) => acc + item.Stocks, 0);
      const forexTotal = weekData.reduce((acc, item) => acc + item.Forex, 0);
      
      weeklyData.push({
        week: `Week ${weekNumber}`,
        Crypto: cryptoTotal,
        Stocks: stocksTotal,
        Forex: forexTotal
      });
    }
    
    // Calculate overall totals for current month
    const cryptoTotal = dailyDataForMonth.reduce((acc, item) => acc + item.Crypto, 0);
    const stocksTotal = dailyDataForMonth.reduce((acc, item) => acc + item.Stocks, 0);
    const forexTotal = dailyDataForMonth.reduce((acc, item) => acc + item.Forex, 0);
    const totalEarnings = cryptoTotal + stocksTotal + forexTotal;
    
    // Calculate overall stats for current month
    const averageValue = totalEarnings / weeklyData.length;
    
    // Determine best week
    let bestPeriod = '';
    let bestPeriodValue = 0;
    
    if (weeklyData.length > 0) {
      const bestEntry = weeklyData.reduce((max, item) => {
        const total = item.Crypto + item.Stocks + item.Forex;
        return total > max.total ? { ...item, total } : max;
      }, { total: 0 });
      
      bestPeriod = bestEntry.week;
      bestPeriodValue = bestEntry.total;
    }
    
    // Time range label for current month data
    const timeRangeLabel = format(currentMonthDate, 'MMMM yyyy');
    
    return {
      lineData: weeklyData,
      stats: {
        totalEarnings,
        averageValue,
        bestPerformer: cryptoTotal > stocksTotal && cryptoTotal > forexTotal ? 'Crypto' : 
                      stocksTotal > forexTotal ? 'Stocks' : 'Forex',
        bestPeriod,
        bestPeriodValue,
        changePercentage: '12.8%' // Default for current month
      },
      timeRangeLabel
    };
  }, [currentMonthDate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Update pie chart date when calendar changes
  const handlePieChartDateChange = (newDate) => {
    setPieChartDate(newDate);
  };

  // date selections for pie chart
  const handleQuickSelect = (option) => {
    const today = new Date();
    let newDate = today;

    switch (option) {
      case 'thisWeek':
        newDate = startOfWeek(today);
        break;
      case 'lastWeek':
        newDate = startOfWeek(subDays(today, 7));
        break;
      case 'thisMonth':
        newDate = startOfMonth(today);
        break;
      case 'lastMonth':
        newDate = startOfMonth(subMonths(today, 1));
        break;
      case 'thisYear':
        newDate = startOfYear(today);
        break;
      default:
        newDate = today;
    }

    setPieChartDate(newDate);
  };

  // Calendar styling - ALL TEXT WHITE
  const tileClassName = ({ date: tileDate, view }) => {
    if (view === 'month') {
      const today = new Date();
      const currentDate = new Date(tileDate);
      
      // Today's date
      if (currentDate.toDateString() === today.toDateString()) {
        return "bg-blue-500 text-white font-medium";
      }
      
      // Selected date for pie chart
      if (currentDate.toDateString() === pieChartDate.toDateString()) {
        return "bg-green-500 text-white font-medium";
      }
      
      return "text-white hover:bg-gray-800";
    }
    return "";
  };

  // Custom CSS for calendar white text - FIXED VERSION
  const calendarStyles = `
    .react-calendar {
      background-color: transparent !important;
      color: white !important;
      width: 100% !important;
      border: none !important;
    }
    
    .react-calendar__navigation {
      color: white !important;
    }
    
    .react-calendar__navigation button {
      color: white !important;
      font-weight: 600;
      background: transparent !important;
      border: none !important;
    }
    
    .react-calendar__navigation button:hover {
      background-color: #374151 !important;
    }
    
    .react-calendar__navigation button:enabled:hover,
    .react-calendar__navigation button:enabled:focus {
      background-color: #374151 !important;
    }
    
    .react-calendar__tile {
      color: white !important;
      background: transparent !important;
      border: none !important;
    }
    
    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: #374151 !important;
    }
    
    .react-calendar__tile:disabled {
      color: #666 !important;
    }
    
    .react-calendar__tile--now {
      background-color: #3b82f6 !important;
      color: white !important;
    }
    
    .react-calendar__tile--active {
      background-color: #10b981 !important;
      color: white !important;
    }
    
    .react-calendar__month-view__weekdays {
      color: #d1d5db !important;
      font-weight: 500;
      text-decoration: none !important;
    }
    
    .react-calendar__month-view__weekdays__weekday {
      color: #d1d5db !important;
    }
    
    .react-calendar__month-view__weekdays__weekday abbr {
      text-decoration: none !important;
      border: none !important;
    }
    
    .react-calendar__month-view__days__day--weekend {
      color: white !important;
    }
    
    .react-calendar__month-view__days__day--neighboringMonth {
      color: #666 !important;
    }
  `;

  // Custom tooltip for pie chart
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
            {((payload[0].value / total) * 100).toFixed(1)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for line chart
  const LineCustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 shadow-2xl">
          <p className="font-bold text-white mb-2 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
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

  // Toggle calendar visibility for pie chart
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="flex flex-col bg-[#0d0d0d] pt-20 px-4 md:px-6 min-h-screen gap-6 md:gap-8">
      {/* Add custom calendar styles */}
      <style>{calendarStyles}</style>
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl md:text-3xl font-bold">Portfolio Overview</h1>
        <div className="text-sm text-gray-400">
          Current Month: <span className="font-semibold text-white">{format(currentMonthDate, 'MMMM yyyy')}</span>
        </div>
      </div>

      {/* Stats Cards - ALWAYS SHOW CURRENT MONTH DATA */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[
          { 
            title: `Total Earnings (Current Month)`, 
            value: formatCurrency(stats.totalEarnings), 
            change: `${stats.changePercentage} Return`, 
            icon: <IoIosArrowRoundUp size={20} className='text-green-400' />,
            changeColor: 'text-green-400'
          },
          { 
            title: `Best Week`, 
            value: stats.bestPeriod, 
            change: `+${formatCurrency(stats.bestPeriodValue)}`, 
            changeColor: 'text-green-400'
          },
          { 
            title: 'Weekly Average', 
            value: formatCurrency(stats.averageValue), 
            change: 'Consistent Growth', 
            changeColor: 'text-green-400'
          },
          { 
            title: 'Best Asset Class', 
            value: stats.bestPerformer, 
            change: 'Top Performer', 
            changeColor: 'text-green-400'
          },
        ].map((widget, index) => (
          <div 
            key={index}
            className='bg-[#181818] p-4 md:p-6 text-left rounded-xl md:rounded-2xl hover:bg-[#1f1f1f] transition-colors duration-200 border border-gray-800'
          >
            <div className='text-xs text-gray-400 mb-1'>{widget.title}</div>
            <div className='text-xl md:text-2xl text-white font-bold mb-2'>{widget.value}</div>
            <div className={`flex items-center ${widget.icon ? 'gap-1' : ''}`}>
              {widget.icon && widget.icon}
              <div className={`text-xs font-medium ${widget.changeColor}`}>{widget.change}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Pie Chart Section with Calendar Control - FIXED CHART DIMENSIONS */}
      <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center border border-gray-800">
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-white text-lg font-semibold">Portfolio Distribution</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400 bg-gray-900/50 px-3 py-1 rounded-lg">
              {pieTimeRangeLabel}
            </div>
            {/* Calendar Icon Button - ONLY FOR PIE CHART */}
            <button 
              onClick={toggleCalendar}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
              title="Select date for pie chart"
            >
              <FaCalendarAlt />
            </button>
          </div>
        </div>
        
        {/* FIXED: Added min-height to container */}
        <div className="h-64 w-full min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                innerRadius={80}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
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
                ${(item.value / 1000).toFixed(0)}k
              </span>
            </div>
          ))}
        </div>

        {/* Pie Chart Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total for Selected Week</div>
            <div className="text-lg font-bold text-white">{formatCurrency(pieChartStats.totalEarnings)}</div>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Best Performer</div>
            <div className="text-lg font-bold text-white">{pieChartStats.bestPerformer}</div>
          </div>
        </div>
      </div>

      {/* Weekly Line Graph - Shows Current Month Weekly Earnings - FIXED CHART DIMENSIONS */}
      <div className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-5 border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">
            Weekly Earnings for Current Month ({format(currentMonthDate, 'MMMM yyyy')})
          </h3>
          <div className="text-sm text-gray-400">
            Total: <span className="font-bold text-green-400">{formatCurrency(stats.totalEarnings)}</span>
          </div>
        </div>
        {/* FIXED: Added min-height to container */}
        <div className="h-72 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="week" 
                stroke="#666" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#666" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip content={<LineCustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  color: '#ccc'
                }}
              />
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

      {/* Calendar Modal/Popup for Pie Chart - FIXED CALENDAR */}
      {showCalendar && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleCalendar();
            }
          }}
        >
          <motion.div 
            className="bg-[#181818] rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 w-full max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold">Select Date for Pie Chart</h3>
              <button 
                onClick={toggleCalendar}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Calendar Component - FIXED: Removed formatShortWeekday to avoid error */}
            <div className="bg-[#0d0d0d] rounded-lg p-3 border border-gray-700">
              <Calendar
                onChange={handlePieChartDateChange}
                value={pieChartDate}
                className="!bg-transparent !border-0 !text-white"
                tileClassName={tileClassName}
                next2Label={null}
                prev2Label={null}
                formatMonthYear={(locale, date) => format(date, 'MMMM yyyy')}
                formatShortWeekday={(locale, date) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}
                prevLabel={
                  <div className="text-white hover:text-blue-400 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                }
                nextLabel={
                  <div className="text-white hover:text-blue-400 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                }
              />
            </div>

            {/* Quick selection for pie chart */}
            <div className="flex flex-wrap gap-2 mb-4 mt-4">
              {['This Week', 'Last Week', 'This Month', 'Last Month', 'This Year'].map((option) => (
                <button 
                  key={option}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
                  onClick={() => {
                    handleQuickSelect(option.toLowerCase().replace(' ', ''));
                    toggleCalendar(); // Close calendar after selection
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* Selected Date Info */}
            <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-gray-300 text-sm">
                Pie Chart will show data for week starting: <span className="font-semibold text-white">
                  {format(pieChartDate, 'EEEE, MMMM d, yyyy')}
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