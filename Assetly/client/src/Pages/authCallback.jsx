import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API, { setAccessToken } from "../Api/axios";
import { AppContext } from "../Context/appContext";

const AuthCallback = () => {
    const { getUserData } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        const finishLogin = async () => {
            try {
                const { data } = await API.post("/api/auth/refresh");
                setAccessToken(data.access_token);
                await getUserData();
                navigate("/home");
            } catch {
                navigate("/login?error=oauth_failed");
            }
        };
        finishLogin();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d] text-white">
            Signing you in...
        </div>
    );
};

export default AuthCallback;