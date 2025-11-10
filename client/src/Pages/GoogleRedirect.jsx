import { useEffect, useContext } from "react";
import { AppContext } from "../Context/appContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const GoogleRedirect = () => {
  const { getUserData, setIsLoggedIn } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      getUserData(accessToken)
        .then(() => {
          setIsLoggedIn(true);
          navigate("/home");
        })
        .catch(() => {
          toast.error("Failed to fetch user data");
        });
    } else {
      toast.error("Google login failed: token missing");
    }
  }, []);

  return <div>Logging you in...</div>;
};

export default GoogleRedirect;
