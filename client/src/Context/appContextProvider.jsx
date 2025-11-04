import { useState, useMemo, useEffect } from "react";
import { AppContext } from "./appContext";
import { toast } from "react-toastify";
import API from "../Api/axios.js";

export const AppContextProvider = ({ children }) => {
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
   
  // if (initialToken && !userData) {
  //   getUserData(initialToken);
  // }

  const logoutUser = async () => {
    try {
      const { data } = await API.post(`/api/auth/logout`);
      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        localStorage.removeItem("access_token");
        toast.success("Logged out successfully");
      } else {
        toast.error(data.message || "Logout failed.");
      }
    } catch (error) {
      toast.error("Logout failed. Try again.");
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
