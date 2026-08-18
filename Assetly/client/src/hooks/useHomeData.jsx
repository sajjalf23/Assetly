import { useState, useEffect } from 'react';
import API from '../Api/axios';

export const useHomeData = () => {
    const [stats, setStats] = useState(null);
    const [homeData, setHomeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchHomeData = async () => {
            try {
                setError(null);
                const { data } = await API.get("/api/home/page", {
                    signal: controller.signal
                });
                if (data.success) {
                    setHomeData(data.history || []);
                    setStats(data);
                } else {
                    setError("Failed to load portfolio data.");
                }
            } catch (err) {
                if (err.name !== 'CanceledError') {
                    console.error("Home Data Fetch Error:", err);
                    setError(err.response?.data?.message || "An unexpected error occurred.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();

        return () => controller.abort();
    }, []);

    return { stats, homeData, loading, error };
};