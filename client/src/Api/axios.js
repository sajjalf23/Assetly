import axios from "axios";

let accessToken = null;
let refreshPromise = null;

// =========================================================
// TOKEN HELPERS
// =========================================================

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

// =========================================================
// PUBLIC ROUTES
// These routes should NEVER trigger token refresh.
// =========================================================

const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/signin",
  "/api/auth/login",
  "/api/auth/googleLogin",
  "/api/auth/callback",
  "/api/auth/resetpassword",
  "/api/auth/resetPassword",
  "/api/auth/refresh",
];

// =========================================================
// CHECK IF REQUEST IS PUBLIC
// =========================================================

const isPublicRoute = (url = "") => {
  return PUBLIC_ROUTES.some((route) => url.includes(route));
};

// =========================================================
// AXIOS INSTANCE
// =========================================================

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

API.interceptors.request.use(
  (config) => {
    // Add access token when available.
    //
    // We don't need to block public routes if there is no token.
    // They can still execute normally.

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // No config = nothing we can retry
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // -------------------------------------------------------
    // IMPORTANT:
    // Never try to refresh authentication for public routes.
    // -------------------------------------------------------

    if (isPublicRoute(requestUrl)) {
      return Promise.reject(error);
    }

    // -------------------------------------------------------
    // Only handle 401 errors
    // -------------------------------------------------------

    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // -------------------------------------------------------
    // DEDUPE concurrent refresh requests
    // -------------------------------------------------------

    if (!refreshPromise) {
      refreshPromise = API.post("/api/auth/refresh")
        .then(({ data }) => {

          if (!data?.access_token) {
            throw new Error("No access token returned from refresh");
          }

          setAccessToken(data.access_token);

          return data.access_token;
        })
        .catch((err) => {
          setAccessToken(null);
          throw err;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return API(originalRequest);

    } catch (refreshError) {

      setAccessToken(null);

      // Don't redirect from public auth requests.
      // This is mainly a safety check.
      if (!isPublicRoute(requestUrl)) {
        window.location.href = "/auth/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default API;