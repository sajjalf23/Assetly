import { useEffect, useContext } from "react";
import { AppContext } from "../Context/appContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import supabase from "../../config/supabaseClient"; 

const GoogleRedirect = () => {
  const { getUserData, setIsLoggedIn } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error.message);
          toast.error("Google login failed. Please try again.");
          return;
        }

        const accessToken = data.session?.access_token;
        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          setIsLoggedIn(true);

          await getUserData(accessToken);

          navigate("/home", { replace: true });
          toast.success("Logged in successfully! To Enter Next time using Login, First Reset Password. Otherwise stick to Google Login.");
        } else {
          toast.error("Google login failed: token missing");
        }
      } catch (err) {
        console.error("Error during redirect:", err);
        toast.error("Something went wrong");
      }
    };

    handleRedirect();
  }, []);
// getUserData, navigate, setIsLoggedIn
  return <div style={{backgroundColor:"black", color:"white", fontWeight: "bold",}}>Logging you in...</div>;
};

export default GoogleRedirect;
