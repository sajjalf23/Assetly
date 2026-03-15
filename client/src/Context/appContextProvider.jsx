import { useState, useMemo, useEffect, useCallback } from "react";
import { AppContext } from "./appContext";
import { toast } from "react-toastify";
import API from "../Api/axios.js";
import { useNavigate } from "react-router-dom";
import supabase from '../../config/supabaseClient';

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const BackendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  const loadAccounts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const { data } = await API.get(`/api/account/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setAccounts(data.account || {});
        return data.account;
      } else {
        setAccounts({});
        console.error("Failed to load accounts:", data.message);
      }
    } catch (error) {
      console.error("Accounts fetch error:", error);
      setAccounts({});
      
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        setIsLoggedIn(false);
        setUserData(null);
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      }
    }
  }, [navigate]);

  const getUserData = useCallback(async (token) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.get(`/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("User data fetched:", data);
      if (data.success) {
        setUserData(data.user);
        setIsLoggedIn(true);
        
        // Load accounts after user data is fetched
        await loadAccounts();
      } else {
        setUserData(null);
        setIsLoggedIn(false);
        localStorage.removeItem("access_token"); 
        toast.error(data.message || "Failed to fetch user info");
      }
    } catch (error) {
      console.error("User fetch error:", error);
      setUserData(null);
      setIsLoggedIn(false);
      localStorage.removeItem("access_token"); 
      if (error.response?.status !== 401) {
        toast.error("Failed to fetch user information");
      }
    } finally {
      setLoading(false);
    }
  }, [loadAccounts]);

  const refreshAccounts = async () => {
    return await loadAccounts();
  };

  const logoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsLoggedIn(false);
      setUserData(null);
      setAccounts(null);

      localStorage.removeItem("access_token");
      navigate("/");
      toast.success("Logged out successfully");
    } catch (err) {
      console.error("Logout failed:", err.message);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    
    if (token) {
      getUserData(token);
    } else {
      setLoading(false);
    }
  }, [getUserData]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Supabase auth state changed:", event);
        
        if (event === 'SIGNED_IN' && session) {
          localStorage.setItem("access_token", session.access_token);
          getUserData(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUserData(null);
          setIsLoggedIn(false);
          setAccounts(null);
          localStorage.removeItem("access_token");
        } else if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem("access_token", session.access_token);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [getUserData]);

  const value = useMemo(
    () => ({
      BackendUrl,
      toast,
      isLoggedIn,
      setIsLoggedIn,
      userData,
      setUserData,
      accounts,
      setAccounts,
      refreshAccounts,
      getUserData,
      logoutUser,
      loading,
    }),
    [BackendUrl, isLoggedIn, userData, accounts, loading, getUserData, logoutUser]
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};