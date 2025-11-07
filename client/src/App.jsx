import React, { useContext } from 'react'
import { Route, Routes, BrowserRouter, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import Signup from "/src/Pages/Signup";
import Login from "/src/Pages/Login";
import ForgotPassword from "/src/Pages/ForgotPassword";
import GoogleRedirect from "/src/Pages/GoogleRedirect";
import ChangePassword from '/src/Pages/ChangePassword';
import { AppContext } from "/src/Context/appContext";
import Home from './Pages/Home'
import Earnings from './Pages/Earnings';
import Navbar from './components/Navbar';

// inner component that can safely use useLocation
const AppContent = () => {
  const { userData } = useContext(AppContext);
  const location = useLocation();

  // pages where we don't want navbar
  const hideNavbarPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/callback',
    '/auth/change-password'
  ];

  // check if current path is in that list
  const hideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <div className="bg-[#0d0d0d] min-h-screen">
      {/* Show Navbar only if not on auth pages */}
      {!hideNavbar && <Navbar />}

      <div className="pl-10px md:pl-[270px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<GoogleRedirect />} />
          <Route path="/auth/change-password" element={<ChangePassword />} />
          <Route path="/earnings" element={<Earnings />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <>
    <ToastContainer />
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </>
);

export default App;
