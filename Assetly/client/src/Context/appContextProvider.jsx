import { useState, useMemo, useEffect, useCallback } from "react";
import { AppContext } from "./appContext";
import { toast } from "react-toastify";
import API, { setAccessToken, getAccessToken } from "../Api/axios";
import { useNavigate } from "react-router-dom";
import supabase from '../../config/supabaseClient';

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const BackendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // TRANSACTION PAGINATION STATE
  // =========================================================
  const [transactionPagination, setTransactionPagination] = useState(() => {
    const cached = sessionStorage.getItem(
      'cached_transaction_pagination'
    );

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore invalid cache
      }
    }

    return {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    };
  });

  // =========================================================
  // TRANSACTIONS STATE
  // =========================================================
  const [transactions, setTransactions] = useState(() => {
    // Try to load cached page 1 transactions - or lazi initialize to empty array
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


  // =========================================================
  // ACCOUNTS
  // =========================================================
  const loadAccounts = useCallback(async () => {
    try {
      const { data } = await API.get(`/api/account/accounts`);

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

  // =========================================================
  // FETCH TRANSACTIONS WITH PAGINATION
  // =========================================================
  const fetchTransactions = useCallback(async (
    page = 1,
    forceRefresh = false
  ) => {
    const token = getAccessToken();

    if (!token) {
      console.log("No token found, skipping transaction fetch");
      return;
    }

    const now = Date.now();

    const CACHE_DURATION = 5 * 60 * 1000;

    // ---------------------------------------------------------
    // Only use cache for PAGE 1
    // Pages 2, 3, 4... should always request from backend
    // ---------------------------------------------------------
    if (
      page === 1 &&
      !forceRefresh &&
      initialFetchDone &&
      (now - lastFetchTime) < CACHE_DURATION
    ) {
      console.log("Using cached page 1 transactions");
      return;
    }

    setTransactionsLoading(true);

    try {

      const { data } = await API.get(
        `/api/transactions/history?page=${page}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {

        // Current page replaces transactions in memory
        setTransactions(data.transactions || []);

        // Save pagination information
        setTransactionPagination(
          data.pagination || {
            page: page,
            limit: 50,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          }
        );

        // -----------------------------------------------------
        // ONLY CACHE PAGE 1
        // -----------------------------------------------------
        if (page === 1) {

          sessionStorage.setItem(
            "cached_transactions",
            JSON.stringify(data.transactions || [])
          );

          sessionStorage.setItem(
            "cached_summary",
            JSON.stringify(data.summary || null)
          );

          sessionStorage.setItem(
            "cached_transaction_pagination",
            JSON.stringify(data.pagination)
          );

          sessionStorage.setItem(
            "last_fetch_time",
            now.toString()
          );

          sessionStorage.setItem(
            "initial_fetch_done",
            "true"
          );

          setLastFetchTime(now);
          setInitialFetchDone(true);
        }

        console.log(
          `Loaded page ${data.pagination?.page} of ${data.pagination?.totalPages}`
        );

        return data;

      } else {

        console.error(
          "Failed to load transactions:",
          data.message
        );

        if (!forceRefresh) {
          toast.error(
            data.message || "Failed to load transactions"
          );
        }
      }

    } catch (error) {

      console.error(
        "Transactions fetch error:",
        error
      );

      if (error.response?.status === 401) {

        localStorage.removeItem("access_token");

        setIsLoggedIn(false);
        setUserData(null);

        toast.error(
          "Session expired. Please log in again."
        );

        navigate("/login");

      } else if (!forceRefresh) {

        toast.error(
          "Failed to load transaction history"
        );
      }

    } finally {

      setTransactionsLoading(false);

    }

  }, [
    navigate,
    initialFetchDone,
    lastFetchTime
  ]);

  // =========================================================
  // GET USER DATA
  // =========================================================
  const getUserData = useCallback(async () => {

    try {

      const { data } = await API.get("/api/auth/user");

      console.log("User data fetched:", data);

      if (data.success) {
        setUserData(data.user);
        setIsLoggedIn(true);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }

    } catch (error) {

      console.error("User fetch error:", error);

      setUserData(null);
      setIsLoggedIn(false);

    } finally {
      setLoading(false);
    }

  }, []);

  // =========================================================
  // REFRESH ACCOUNTS
  // =========================================================
  const refreshAccounts = async () => {
    return await loadAccounts();
  };

  // =========================================================
  // REFRESH TRANSACTIONS
  // =========================================================
  const refreshTransactions = useCallback(async () => {

    // Refresh ALWAYS starts from page 1
    const result = await fetchTransactions(1, true);

    toast.success("Transactions refreshed!");

    return result;

  }, [fetchTransactions]);

  // =========================================================
  // LOGOUT
  // =========================================================
  const logoutUser = async () => {

    try {

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setIsLoggedIn(false);
      setUserData(null);
      setAccounts(null);
      setTransactions([]);
      setTransactionSummary(null);

      // Reset pagination
      setTransactionPagination({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });

      setInitialFetchDone(false);
      setLastFetchTime(0);

      navigate("/");

      toast.success("Logged out successfully");

    } catch (err) {

      console.error(
        "Logout failed:",
        err.message
      );

      toast.error("Logout failed");

    }
  };

  // =========================================================
  // INITIAL USER CHECK
  // =========================================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await API.post("/api/auth/refresh");
        setAccessToken(data.access_token);
        await getUserData();
      } catch {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // =========================================================
  // SUPABASE AUTH LISTENER
  // =========================================================
  useEffect(() => {

    const { data: authListener } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {

          console.log(
            "Supabase auth state changed:",
            event
          );

          if (event === 'SIGNED_IN' && session) {
            await getUserData();

          } else if (event === 'SIGNED_OUT') {

            setUserData(null);
            setIsLoggedIn(false);
            setAccounts(null);
            setTransactions([]);
            setTransactionSummary(null);

            setTransactionPagination({
              page: 1,
              limit: 50,
              total: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            });

            setInitialFetchDone(false);
            setLastFetchTime(0);


            sessionStorage.clear();

          } else if (event === 'TOKEN_REFRESHED' && session) {
            console.log("Access Token refreshed")
          }

        }
      );

    return () => {

      authListener?.subscription.unsubscribe();

    };

  }, [getUserData]);

  // =========================================================
  // CONTEXT VALUE
  // =========================================================
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

      // Transactions
      transactions,
      setTransactions,

      transactionsLoading,

      transactionSummary,

      fetchTransactions,

      refreshTransactions,

      // Pagination
      transactionPagination

    }),
    [
      BackendUrl,
      isLoggedIn,
      userData,
      accounts,
      loading,

      getUserData,
      logoutUser,

      transactions,
      transactionsLoading,
      transactionSummary,

      fetchTransactions,
      refreshTransactions,

      transactionPagination
    ]
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};