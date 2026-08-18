// data/transactionsDummyData.js

export const transactions = [
  {
    account: "Binance",
    date: "2024-01-15",
    entity: "BTC/USDT",
    quantity: "0.05",
    amount: "+$1,250.00"
  },
  {
    account: "Binance",
    date: "2024-01-14",
    entity: "ETH/USDT",
    quantity: "0.5",
    amount: "+$750.00"
  },
  {
    account: "KuCoin",
    date: "2024-01-13",
    entity: "SOL/USDT",
    quantity: "10",
    amount: "-$950.00"
  },
  {
    account: "Coinbase",
    date: "2024-01-12",
    entity: "ADA/USD",
    quantity: "1000",
    amount: "+$450.00"
  },
  {
    account: "OANDA",
    date: "2024-01-11",
    entity: "EUR/USD",
    quantity: "10000",
    amount: "+$120.00"
  },
  {
    account: "Paper Invest",
    date: "2024-01-10",
    entity: "AAPL",
    quantity: "10",
    amount: "+$1,850.00"
  },
  {
    account: "Binance",
    date: "2024-01-09",
    entity: "BNB/USDT",
    quantity: "2",
    amount: "-$600.00"
  },
  {
    account: "KuCoin",
    date: "2024-01-08",
    entity: "DOT/USDT",
    quantity: "50",
    amount: "+$325.00"
  },
  {
    account: "Coinbase",
    date: "2024-01-07",
    entity: "DOGE/USD",
    quantity: "5000",
    amount: "-$475.00"
  },
  {
    account: "OANDA",
    date: "2024-01-06",
    entity: "GBP/USD",
    quantity: "5000",
    amount: "-$85.00"
  },
  {
    account: "Paper Invest",
    date: "2024-01-05",
    entity: "TSLA",
    quantity: "5",
    amount: "+$1,200.00"
  },
  {
    account: "Binance",
    date: "2024-01-04",
    entity: "XRP/USDT",
    quantity: "500",
    amount: "+$195.00"
  },
  {
    account: "KuCoin",
    date: "2024-01-03",
    entity: "AVAX/USDT",
    quantity: "15",
    amount: "-$450.00"
  },
  {
    account: "Coinbase",
    date: "2024-01-02",
    entity: "MATIC/USD",
    quantity: "200",
    amount: "+$280.00"
  },
  {
    account: "Coinbase",
    date: "2023-12-25",
    entity: "LTC/USD",
    quantity: "8",
    amount: "-$520.00"
  },
  {
    account: "OANDA",
    date: "2023-12-24",
    entity: "AUD/USD",
    quantity: "15000",
    amount: "+$105.00"
  }
];

// Optional: Add helper functions for filtering/summarizing
export const getUniqueAccounts = () => {
  return [...new Set(transactions.map(t => t.account))];
};

export const getTotalByAccount = (account) => {
  return transactions
    .filter(t => t.account === account)
    .reduce((sum, t) => {
      const amount = parseFloat(t.amount.replace(/[^0-9.-]/g, ''));
      return sum + amount;
    }, 0);
};

export const getTotalIncoming = () => {
  return transactions
    .filter(t => t.amount.startsWith('+'))
    .reduce((sum, t) => {
      const amount = parseFloat(t.amount.replace(/[^0-9.-]/g, ''));
      return sum + amount;
    }, 0);
};

export const getTotalOutgoing = () => {
  return transactions
    .filter(t => t.amount.startsWith('-'))
    .reduce((sum, t) => {
      const amount = parseFloat(t.amount.replace(/[^0-9.-]/g, ''));
      return sum + amount;
    }, 0);
};