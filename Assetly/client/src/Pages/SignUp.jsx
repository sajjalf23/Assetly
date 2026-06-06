import { useState, useContext } from "react";
import { AppContext } from "../Context/appContext";
import API from "../Api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "../assets/googleicon.png";

const SignUp = () => {
  const { BackendUrl, setUserData, setIsLoggedIn ,getUserData } = useContext(AppContext);
  const [formData, setFormData] = useState({
    username: "",
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
      const { data } = await API.post(`/api/auth/register`, formData);

      if (data.success) {
        toast.success("Account created successfully!");
        setUserData(data.user);
        setIsLoggedIn(true);
        if (data.session?.access_token) {
        localStorage.setItem("access_token", data.session.access_token);
      }
        navigate("/"); 
      } else {
        toast.error(data.message || "Registration failed!");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };

const handleGoogleSignUp = async () => {
  try {
    const { data } = await API.get(`/api/auth/googleLogin`);
    if (data.url) window.location.href = data.url;
    getUserData(data.session?.access_token);
    setIsLoggedIn(true);
  } catch (error) {
    toast.error("Google login failed");
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d] ">
      <div className="bg-white box-border w-[400px]  p-10 rounded-2xl shadow-2xl ">
        <h2 className="text-center text-[#00e238] text-3xl font-bold mb-4 font-outfit">
          Sign Up for Assetly 
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div>
            <label htmlFor="username" className="text-sm text-gray-700 block mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              className="w-full p-2 bg-[#f9f9f9] border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00e238]"
            />
          </div>

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

          <button
            type="submit"
            className="bg-[#00e238] text-[#0d0d0d] font-semibold py-2 rounded-lg hover:bg-[#00c92f] transition-transform duration-150 hover:-translate-y-0.5"
          >
            Create Account
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center border border-gray-300 rounded-lg py-2.5 hover:bg-gray-100 transition"
        >
          <img
            src={GoogleIcon}
            alt="Google Logo"
            className="w-5 h-5 mr-2"
          />
          Sign up with Google
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="text-[#00e238] font-medium hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;


