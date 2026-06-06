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
  
  // Add transactions state with cache initialization
  const [transactions, setTransactions] = useState(() => {
    // Try to load cached transactions from sessionStorage (cleared on tab close)
    const cached = sessionStorage.getItem('cached_transactions');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState(() => {
    const cached = sessionStorage.getItem('cached_summary');
    return cached ? JSON.parse(cached) : null;
  });
  
  // Track if initial fetch has been done
  const [initialFetchDone, setInitialFetchDone] = useState(() => {
    return sessionStorage.getItem('initial_fetch_done') === 'true';
  });
  
  // Track last fetch time
  const [lastFetchTime, setLastFetchTime] = useState(() => {
    const cached = sessionStorage.getItem('last_fetch_time');
    return cached ? parseInt(cached) : 0;
  });

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

  // Add fetch transactions function with caching
  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    const token = getAuthToken();
    if (!token) {
      console.log('No token found, skipping transaction fetch');
      return;
    }

    // Check if we should skip fetching
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    if (!forceRefresh && initialFetchDone && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('Using cached transactions (less than 5 min old)');
      return;
    }

    setTransactionsLoading(true);
    
    try {
      const { data } = await API.get(`/api/transactions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setTransactions(data.transactions || []);
        setTransactionSummary(data.summary || null);
        
        // Save to sessionStorage (cleared when tab/browser closes)
        sessionStorage.setItem('cached_transactions', JSON.stringify(data.transactions || []));
        sessionStorage.setItem('cached_summary', JSON.stringify(data.summary || null));
        sessionStorage.setItem('last_fetch_time', now.toString());
        sessionStorage.setItem('initial_fetch_done', 'true');
        
        setLastFetchTime(now);
        setInitialFetchDone(true);
        
        console.log(`Loaded ${data.total} transactions`, data.summary);
        return data;
      } else {
        console.error("Failed to load transactions:", data.message);
        if (!forceRefresh) {
          toast.error(data.message || "Failed to load transactions");
        }
      }
    } catch (error) {
      console.error("Transactions fetch error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        setIsLoggedIn(false);
        setUserData(null);
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      } else if (!forceRefresh) {
        toast.error("Failed to load transaction history");
      }
    } finally {
      setTransactionsLoading(false);
    }
  }, [navigate, initialFetchDone, lastFetchTime]);

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
        
        // Only fetch transactions if we don't have cached data or cache is old
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000;
        const hasValidCache = initialFetchDone && (now - lastFetchTime) < CACHE_DURATION;
        
        if (!hasValidCache) {
          await fetchTransactions();
        } else {
          console.log('Using cached transactions on login');
        }
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
  }, [loadAccounts, fetchTransactions, initialFetchDone, lastFetchTime]);

  const refreshAccounts = async () => {
    return await loadAccounts();
  };

  // Add refresh transactions function
  const refreshTransactions = useCallback(async () => {
    await fetchTransactions(true);
    toast.success("Transactions refreshed!");
  }, [fetchTransactions]);

  const logoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setIsLoggedIn(false);
      setUserData(null);
      setAccounts(null);
      setTransactions([]);
      setTransactionSummary(null);
      setInitialFetchDone(false);
      setLastFetchTime(0);
      
      // Clear session storage on logout
      sessionStorage.removeItem('cached_transactions');
      sessionStorage.removeItem('cached_summary');
      sessionStorage.removeItem('last_fetch_time');
      sessionStorage.removeItem('initial_fetch_done');

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
          setTransactions([]);
          setTransactionSummary(null);
          setInitialFetchDone(false);
          setLastFetchTime(0);
          localStorage.removeItem("access_token");
          sessionStorage.clear(); // Clear all session storage on sign out
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
      transactions,
      setTransactions,
      transactionsLoading,
      transactionSummary,
      fetchTransactions,
      refreshTransactions,
    }),
    [BackendUrl, isLoggedIn, userData, accounts, loading, getUserData, logoutUser, 
     transactions, transactionsLoading, transactionSummary, fetchTransactions, refreshTransactions]
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};