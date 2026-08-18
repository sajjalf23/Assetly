import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../Context/appContext";

export default function ProtectedRoute() {

    const { isLoggedIn, loading } = useContext(AppContext);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}