import { useState, useContext } from "react";
import { AppContext } from "../Context/appContext";
import API from "../Api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "../assets/googleicon.png"; 

const Login = () => {
  const { setUserData, setIsLoggedIn ,getUserData} = useContext(AppContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post(`/api/auth/signin`, formData);

      if (data.success) {
        toast.success("Login successful!");
        getUserData(data.session?.access_token);
        setIsLoggedIn(true);
        if (data.session?.access_token) {
          localStorage.setItem("access_token", data.session.access_token);
        }
        navigate("/home"); 
      } else {
        toast.error(data.message || "Login failed!");
      }
    } catch (error) {
      // console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };
 
  const handleGoogleLogin = async () => {
    try {
      const { data } = await API.get(`/api/auth/googleLogin`);
      // console.log("Google login data:", data);
      if (data.url) {
        // console.log(data);
        window.location.href = data.url;
        // console.log("Access Token:", data.session?.access_token);
      }
    } catch (error) {
      toast.error("Google login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
      <div className="bg-white w-[400px] p-8 rounded-2xl shadow-2xl">
        <h2 className="text-center text-[#00e238] text-3xl font-bold mb-6">
          Welcome to Assetly
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full p-2 bg-[#f9f9f9] border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00e238]"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full p-2 bg-[#f9f9f9] border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00e238]"
            />
          </div>

          <div className="text-right text-sm text-gray-500 mb-2">
            <a href="/auth/forgot-password" className="text-[#00e238] hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="bg-[#00e238] text-[#0d0d0d] font-semibold py-2 rounded-lg hover:bg-[#00c92f] transition-transform duration-150 hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2.5 hover:bg-gray-100 transition"
        >
          <img src={GoogleIcon} alt="Google Logo" className="w-5 h-5 mr-2" />
          Sign in with Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don’t have an account?{" "}
          <a href="/auth/signup" className="text-[#00e238] font-medium hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
