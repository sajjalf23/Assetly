# Assetly

> **A modern personal finance and investment dashboard for tracking, analyzing, and managing multiple asset classes in one place.**

Assetly is a full-stack personal finance platform that brings stocks, cryptocurrency, forex, gold, earnings, market news, transactions, and portfolio analytics into a centralized dashboard.

The application is designed to give users a clear view of their financial activity and market performance while providing secure authentication, portfolio management, and automated financial data updates.

---

## ✨ Features

### 📊 Financial Dashboard
- Portfolio performance overview
- Asset allocation visualization
- Net worth tracking
- Market summaries
- Real-time/near-real-time market data
- Financial performance analytics

### 📈 Stocks
- Stock price tracking
- Percentage price changes
- Market data and performance visualization
- Earnings information
- Historical performance analysis

### 💱 Forex
- Currency pair prices
- Exchange-rate changes
- Forex market data
- Currency performance tracking

### 🪙 Cryptocurrency
- Cryptocurrency prices
- Price change tracking
- Crypto portfolio data
- Transaction management
- Market visualization

### 🥇 Gold & Market Indicators
- Gold price tracking
- Market snapshots
- Multi-asset market overview

### 📰 Financial News
- Market news
- Stock-related news
- Cryptocurrency news
- Financial headlines

### 💰 Earnings Tracker
- Earnings data and growth visualization
- Historical earnings information
- Earnings-focused analytics

### 💳 Account & Transaction Management
- Add financial accounts
- Track account balances
- Record buy/sell transactions
- Transfer tracking
- Transaction history with filtering

### 📲 Portfolio Analytics
- Portfolio overview
- Asset allocation
- Performance tracking
- Historical portfolio analysis

### 📤 Transaction Export
- Excel/XLSX export
- Transaction history export

### 🔐 Authentication & Security
- User registration and login
- Authentication sessions with access/refresh tokens
- Protected routes
- Password change and reset
- Google OAuth integration
- HTTP-only cookies
- Password hashing
- CORS protection
- HTTP security headers
- API rate limiting

### 📧 Newsletter
- Newsletter subscription
- Email-based communication
- Subscription management

### ⏰ Automated Tasks
- Scheduled monthly portfolio snapshots
- Automated financial data updates
- Background market-data processing
- Cron-based scheduled tasks

---

## 🏗️ Architecture

Assetly follows a client-server architecture:


                    ┌──────────────────────┐
                    │      Assetly UI     │
                    │   React + Vite      │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │   Express Backend   │
                    │      Node.js        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication    Market Data     PortfolioData
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │      Supabase       │
                    │    PostgreSQL DB    │
                    └──────────────────────┘



## Folder Structure


```
Assetly/
│
├── client/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── Api/
│   │   │   └── axios.js            # Axios API configuration
│   │   ├── Context/
│   │   │   ├── appContext.jsx
│   │   │   └── appContextProvider.jsx
│   │   ├── Pages/
│   │   │   ├── Accounts.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── Crypto.jsx
│   │   │   ├── Earnings.jsx
│   │   │   ├── Forex.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── News.jsx
│   │   │   ├── Overview.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── Stocks.jsx
│   │   │   ├── Transactions.jsx
│   │   │   └── authCallback.jsx
│   │   ├── components/
│   │   │   ├── ExportTransactionsModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── hooks/
│   │   │   └── useHomeData.jsx
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── data/
│   │   ├── Styles/
│   │   ├── assets/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .env
│
├── server/                         # Node.js + Express backend
│   ├── config/
│   ├── controllers/                # Business logic
│   │   ├── accountsController.js
│   │   ├── authController.js
│   │   ├── cryptoController.js
│   │   ├── earningsController.js
│   │   ├── forexController.js
│   │   ├── homeController.js
│   │   ├── landingPageController.js
│   │   ├── newsController.js
│   │   ├── newsletterController.js
│   │   ├── overviewController.js
│   │   ├── stocksController.js
│   │   └── transactionController.js
│   ├── routes/                     # API routes
│   │   ├── accountRouter.js
│   │   ├── authRouter.js
│   │   ├── cryptoRouter.js
│   │   ├── earningsRouter.js
│   │   ├── forexRouter.js
│   │   ├── homeRouter.js
│   │   ├── landingPageRouter.js
│   │   ├── newsRouter.js
│   │   ├── newsletterRouter.js
│   │   ├── overviewRouter.js
│   │   ├── stocksRouter.js
│   │   └── transactionRouter.js
│   ├── middleware/
│   ├── services/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
│
├── docker-compose.yml
├── .gitignore
└── README.md