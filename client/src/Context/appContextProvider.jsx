import { useState, useMemo, useEffect } from "react";
import { AppContext } from "./appContext";
import { toast } from "react-toastify";
import API from "../Api/axios.js";
import { useNavigate } from "react-router-dom";
import supabase from '../../config/supabaseClient';


export const AppContextProvider = ({ children }) => {
   const navigate = useNavigate();
  const BackendUrl = import.meta.env.VITE_BACKEND_URL;
  const initialToken = localStorage.getItem("access_token");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const getUserData = async (token) => {
    if (!token || userData) return;
    try {
      const { data } = await API.get(`/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setUserData(data.user);
        setIsLoggedIn(true);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
        toast.error(data.message || "Failed to fetch user info");
      }
    } catch (error) {
      console.error("User fetch error:", error);
      setUserData(null);
      setIsLoggedIn(false);
    }
  };


const logoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsLoggedIn(false);
      setUserData(null);

      localStorage.removeItem("access_token");
      navigate("/");
      console.log("Logged out successfully");
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };


  const value = useMemo(
    () => ({
      BackendUrl,
      toast,
      isLoggedIn,
      setIsLoggedIn,
      userData,
      setUserData,
      getUserData,
      logoutUser,
    }),
    [BackendUrl, isLoggedIn, userData]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
