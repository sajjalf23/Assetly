// Sample trade data for a pie chart with PnL and monthly change
const forexData = [
  { pair: "BTC/USD", trades: 25000, pnl: 1250.75, monthlyChange: 4.5 },    // +4.5%
  { pair: "ETH/USD", trades: 15000, pnl: -450.30, monthlyChange: -2.3 },   // -2.3%
  { pair: "XAU/USD", trades: 10000, pnl: 430.20, monthlyChange: 1.8 },     // +1.8%
  { pair: "XAG/USD", trades: 5000, pnl: -120.50, monthlyChange: -0.7 },    // -0.7%
  { pair: "EUR/USD", trades: 7000, pnl: 320.40, monthlyChange: 0.5 },      // +0.5%
  { pair: "GBP/USD", trades: 3000, pnl: -75.25, monthlyChange: -1.2 },     // -1.2%
];




// New dataset for monthly revenue (last 12 months)
const monthlyRevenueData = [
  { month: "Nov", revenue: 8200 },
  { month: "Dec", revenue: 9400 },
  { month: "Jan", revenue: 8800 },
  { month: "Feb", revenue: 9600 },
  { month: "Mar", revenue: 10200 },
  { month: "Apr", revenue: 11000 },
  { month: "May", revenue: 9800 },
  { month: "Jun", revenue: 12000 },
  { month: "Jul", revenue: 12500 },
  { month: "Aug", revenue: 11800 },
  { month: "Sep", revenue: 13000 },
  { month: "Oct", revenue: 12700 },
];


export {forexData, monthlyRevenueData};