import React, { useContext } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Signup from "./Pages/Signup";
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import GoogleRedirect from "./Pages/GoogleRedirect";
import ChangePassword from './Pages/ChangePassword';
import { AppContext } from "./Context/appContext";
import Earnings from './Pages/Earnings';
import Navbar from './components/Navbar';
import LandingPage from './Pages/LandingPage';
import Home from './Pages/Home';
import Forex from './Pages/Forex';
import Stocks from './Pages/Stocks'; 
import Crypto from './Pages/Crypto';
import News from './Pages/News';
import Overview from './Pages/Overview';
import Accounts from './Pages/Accounts';
import Transactions from './Pages/Transactions';
import Settings from './Pages/Settings';

const AppContent = () => {
  const { userData, isLoggedIn } = useContext(AppContext);
  const location = useLocation();

  const hideNavbarPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/callback',
    '/auth/change-password',
    '/'
  ];

  const hideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Show Navbar only on authenticated/Pages */}
      {!hideNavbar && <Navbar />}
      
      {/* Main content area with conditional padding */}
      <div className={hideNavbar ? "" : "md:pl-[250px] transition-all duration-300"}>
        <Routes>
          {/* Public/Auth Routes (no navbar) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<GoogleRedirect />} />
          <Route path="/auth/change-password" element={<ChangePassword />} />
          
          {/* Protected/Dashboard Routes (with navbar) */}
          <Route path="/home" element={<Home />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/forex" element={<Forex />} />
          <Route path="/news" element={<News />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Redirect any unknown route to home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <AppContent />
    </>
  );
};

export default App;