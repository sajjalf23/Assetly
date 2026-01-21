import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip
} from 'recharts';
import { LuSearch } from "react-icons/lu";
import { motion } from 'framer-motion';

// Colors for chart
const COLORS = ["#2775ca", "#f7931a", "#00d09c", "#62688f", "#f0b90b", "#6747ed", "#50af95", "#ff6b6b"];

// Common crypto symbols to CoinGecko ID mapping
const COIN_MAPPING = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'SHIB': 'shiba-inu',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'LEO': 'leo-token',
  'XAUT': 'tether-gold',
  'EURC': 'euro-coin',
  'PORT': 'port-finance',
  // Add more as needed
};

// Get CoinGecko ID from symbol
const getCoinId = (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  return COIN_MAPPING[upperSymbol] || upperSymbol.toLowerCase();
};

// Pie Chart Tooltip
const CustomToolTip = ({ active, payload, total }) => {
  if (active && payload?.length) {
    const crypto = payload[0];
    return (
      <div className='bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 shadow-xl'>
        <p className='font-semibold text-white'>{crypto.name}</p>
        <p className='text-lg text-[#f7931a] font-medium'>
          ${crypto.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className='text-sm text-gray-300'>
          {((crypto.value / total) * 100).toFixed(2)}% of portfolio
        </p>
      </div>
    );
  }
  return null;
};

// Line Chart Tooltip
const CustomToolTipLine = ({ active, payload }) => {
  if (active && payload?.length) {
    const crypto = payload[0].payload;
    return (
      <div className='bg-[#2a2a2a] p-3 rounded-lg border border-gray-700 shadow-xl'>
        <p className='font-semibold text-white mb-1'>{crypto.name}</p>
        <p className='text-[#f7931a] font-medium'>
          Price: ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        {crypto.change24h != null && (
          <p className={`text-sm ${crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            24h: {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function CryptoDashboard() {
  const [chartData, setChartData] = useState([]);
  const [portfolioData, setPortfolioData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all crypto prices in a single call
  const fetchCryptoPrices = async (symbols) => {
    try {
      // Get unique CoinGecko IDs
      const coinIds = [...new Set(symbols.map(symbol => getCoinId(symbol)))];
      
      // Make a single API call for all coins
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24h_change=true`
      );
      
      if (!res.ok) {
        console.warn('Failed to fetch crypto prices, using fallback data');
        return null;
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return null;
    }
  };

  // Fetch data from backend API
  const fetchCryptoData = async () => {
    setIsLoading(true);
    try {
      // Fetch portfolio data from your backend
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const portfolioRes = await fetch(`${apiUrl}/api/crypto/trades`);
      
      if (!portfolioRes.ok) {
        throw new Error("Failed to fetch portfolio data");
      }
      
      const portfolioJson = await portfolioRes.json();
      console.log("Portfolio data:", portfolioJson);
      
      // Process portfolio data
      const portfolioItems = portfolioJson.portfolio || [];
      
      // Filter out assets with zero or negative amount for display
      const validPortfolioItems = portfolioItems
        .filter(item => item.amount > 0)
        .slice(0, 20); // Limit to top 20 assets to avoid too many API calls
      
      // Extract symbols for price lookup
      const symbols = validPortfolioItems.map(item => item.asset);
      
      // Fetch prices in a single API call
      const pricesData = await fetchCryptoPrices(symbols);
      
      // Process portfolio with prices
      const processedPortfolio = validPortfolioItems.map(item => {
        const coinId = getCoinId(item.asset);
        const priceData = pricesData ? pricesData[coinId] : null;
        
        const price = priceData?.usd || 1; // Default to $1 if price not found
        const change24h = priceData?.usd_24h_change || 0;
        const value = price * Math.abs(item.amount);
        
        return {
          symbol: item.asset.toUpperCase(),
          name: item.asset,
          amount: item.amount,
          price: price,
          change24h: change24h,
          value: value,
          tradeCount: item.tradeCount
        };
      });
      
      // Sort by value descending
      const sortedPortfolio = processedPortfolio.sort((a, b) => b.value - a.value);
      
      setPortfolioData(sortedPortfolio);
      setTotal(sortedPortfolio.reduce((sum, item) => sum + item.value, 0));
      
      // Fetch top market data for charts
      try {
        const marketRes = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1&sparkline=false'
        );
        
        if (marketRes.ok) {
          const marketData = await marketRes.json();
          
          // Top 4 coins for Market Overview
          const top4 = marketData.slice(0, 4).map(c => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            price: c.current_price,
            change24h: c.price_change_percentage_24h
          }));
          
          setChartData(top4);
          
          // Top 8 coins for Line Chart
          const top8 = marketData.slice(0, 8).map(c => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            price: c.current_price,
            change24h: c.price_change_percentage_24h
          }));
          
          setLineData(top8);
        }
      } catch (marketError) {
        console.warn('Market data fetch failed, using portfolio data for charts');
        // Use portfolio data for charts if market fetch fails
        const topPortfolio = sortedPortfolio.slice(0, 8);
        setChartData(topPortfolio.slice(0, 4));
        setLineData(topPortfolio);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      // Keep existing data or set empty arrays
      if (!portfolioData.length) {
        setPortfolioData([]);
        setChartData([]);
        setLineData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredData = portfolioData.filter(c =>
    c.symbol.toLowerCase().includes(query) ||
    c.name.toLowerCase().includes(query)
  );

  const displayData = searchQuery ? filteredData : portfolioData;

  return (
    <div className='min-h-screen bg-[#0d0d0d] text-white p-4 md:p-6 pt-20'>
      <h1 className='text-3xl font-bold mb-8'>Crypto Dashboard</h1>

      {/* Main grid */}
      <div className='grid lg:grid-cols-2 gap-6 mb-8'>

        {/* Market Overview Full Width */}
        <motion.div
          className='bg-[#181818] p-6 rounded-2xl shadow-lg mb-6 lg:col-span-2'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className='text-xl font-bold mb-4'>Market Overview</h2>
          {isLoading ? (
            <div className="flex justify-center h-32 items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7931a]"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No market data available
            </div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-5'>
              {chartData.map((c, i) => (
                <div key={i} className='p-3 bg-[#222] rounded-lg hover:bg-[#2a2a2a] transition-colors'>
                  <p className='text-sm text-gray-400 mb-1'>{c.symbol}</p>
                  <p className='text-lg font-semibold' style={{ color: COLORS[i] }}>
                    ${c.price < 1 ? c.price.toFixed(6) : c.price.toFixed(2)}
                  </p>
                  <p className={c.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Left Column */}
        <div className='flex flex-col gap-6'>
          {/* Price Trend */}
          <motion.div className='bg-[#181818] p-6 rounded-2xl shadow-lg' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>Price Trend</h2>
            </div>
            <div className='h-56'>
              {lineData.length === 0 ? (
                <div className='flex justify-center items-center h-full text-gray-400'>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="symbol" stroke="#666" axisLine={false} tickLine={false} />
                    <YAxis stroke="#666" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomToolTipLine />} />
                    <Line type="monotone" dataKey="price" stroke="#f7931a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Portfolio Distribution */}
        <motion.div className='bg-[#181818] p-6 rounded-2xl shadow-lg flex flex-col items-center' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className='text-xl font-semibold mb-4 self-start'>Portfolio Distribution</h2>
          <div className='relative w-full max-w-md h-72'>
            {displayData.length === 0 ? (
              <div className='flex justify-center items-center h-full text-gray-400'>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f7931a]"></div>
                ) : (
                  'No portfolio data'
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={displayData} 
                    dataKey="value" 
                    nameKey="symbol" 
                    innerRadius={60} 
                    outerRadius={100} 
                    labelLine={false} 
                    label={(entry) => `${entry.symbol}: ${total ? ((entry.value / total) * 100).toFixed(1) : 0}%`}
                  >
                    {displayData.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomToolTip total={total} />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center'>
              <div className='text-2xl font-bold'>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              <div className='text-gray-400 text-sm'>Total Portfolio Value</div>
              <div className='text-sm text-gray-500 mt-1'>{displayData.length} assets</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Crypto Assets Table */}
      <motion.div className='bg-[#181818] rounded-2xl p-6 shadow-lg' initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className='flex justify-between mb-4 gap-4'>
          <h2 className='text-2xl font-semibold'>Crypto Assets</h2>
          <div className='flex items-center gap-3 bg-[#222] p-2 rounded-lg w-full sm:w-80'>
            <LuSearch size={20} className='text-gray-400' />
            <input 
              placeholder='Search assets...' 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className='bg-transparent text-white w-full focus:outline-none' 
            />
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px]'>
            <thead className='text-gray-400 bg-[#1f1f1f] text-sm'>
              <tr>
                <th className='py-3 px-4 text-left'>Asset</th>
                <th className='py-3 px-4 text-right'>Amount</th>
                <th className='py-3 px-4 text-right'>Price</th>
                <th className='py-3 px-4 text-right'>24h Change</th>
                <th className='py-3 px-4 text-right'>Value</th>
                <th className='py-3 px-4 text-right'>% Portfolio</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className='py-8 text-center'>
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f7931a]"></div>
                      <span>Loading portfolio data...</span>
                    </div>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan="6" className='py-8 text-center text-gray-400'>
                    No assets found in your portfolio
                  </td>
                </tr>
              ) : displayData.map((row, i) => (
                <tr key={i} className='border-b border-[#2a2a2a] hover:bg-[#202020] transition-colors'>
                  <td className='py-4 px-4 flex items-center gap-3'>
                    <div 
                      className='rounded-full h-3 w-3' 
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    ></div>
                    <div>
                      <div className='font-medium'>{row.symbol}</div>
                      <div className='text-xs text-gray-400'>{row.name}</div>
                    </div>
                  </td>
                  <td className='py-4 px-4 text-right'>
                    {row.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </td>
                  <td className='py-4 px-4 text-right'>
                    ${row.price < 1 ? row.price.toFixed(6) : row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className='py-4 px-4 text-right'>
                    <div className={row.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {row.change24h >= 0 ? '+' : ''}{row.change24h.toFixed(2)}%
                    </div>
                  </td>
                  <td className='py-4 px-4 text-right'>
                    ${row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className='py-4 px-4 text-right'>
                    {total ? ((row.value / total) * 100).toFixed(2) : '0.00'}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && displayData.length > 0 && (
          <div className='mt-4 text-sm text-gray-400'>
            Showing {displayData.length} asset{displayData.length !== 1 ? 's' : ''} • 
            Total Portfolio Value: <span className='text-white font-medium ml-1'>
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}