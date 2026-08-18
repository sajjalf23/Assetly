import axios from "axios";

let accessToken = null;
let refreshPromise = null; // dedupe concurrent refreshes

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // REQUIRED so the httpOnly refresh cookie is sent
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = API.post("/api/auth/refresh")
          .then(({ data }) => {
            setAccessToken(data.access_token);
            return data.access_token;
          })
          .catch((err) => {
            setAccessToken(null);
            throw err;
          })
          .finally(() => { refreshPromise = null; });
      }

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch {
        window.location.href = "/login"; // refresh failed, force re-login
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;