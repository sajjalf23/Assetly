# Assetly
https://docs.google.com/document/d/1hcCEh_MZMEg4kZbixfT4kUkuWVxVmvvy37U20EFDRGk/edit?tab=t.0

Dependencies : 


Architecture (u can change it)
project-root/
│
├── client/                 # React app (frontend)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Charts/
│   │   │   ├── Portfolio/
│   │   │   └── NewsFeed/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── News.jsx
│   │   │   ├── Overview.jsx
│   │   │   ├── Crypto.jsx
│   │   │   ├── Stocks.jsx
│   │   │   ├── Forex.jsx
│   │   │   ├── Trades.jsx
│   │   │   ├── Earnings.jsx
│   │   │   ├── Configurations.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── FAQs.jsx
│   │   │   └── Help.jsx
│   │   ├── hooks/
│   │   ├── services/      # API calls to Express backend
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── portfolio.js
│   │   │   ├── trades.js
│   │   │   ├── earnings.js
│   │   │   ├── news.js
│   │   │   └── config.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── supabaseClient.js
│   │   └── app.js
│   └── package.json
│
└── .env


npm install @supabase/supabase-js axios react-router-dom
npm i nodemon
npm install express cors dotenv jsonwebtoken jwk-to-pem @supabase/supabase-js helmet express-rate-limit bcryptjs
npm install axios react-router-dom  react-toastify

npm install react-icons
