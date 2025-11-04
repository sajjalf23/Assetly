import React, { useCallback, useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import Signup from "/src/Pages/Signup";
import Login from "/src/Pages/Login";
import ForgotPassword from "/src/Pages/ForgotPassword";
import GoogleRedirect from "/src/Pages/GoogleRedirect";
import ChangePassword from '/src/Pages/ChangePassword';
import { AppContext } from "/src/Context/appContext";
import Home from './Pages/Home'

const App = () => {
  const { userData } = useContext(AppContext);
  console.log(userData);
  return (
    <>
    {/* <h1>{userData?.user_metadata.username}</h1> */}
    <div>
      <ToastContainer></ToastContainer>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<GoogleRedirect />} />
        <Route path="/auth/change-password" element={<ChangePassword />} />
      </Routes>
    </div>
    </>
  )
}

export default App
