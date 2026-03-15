import { useState, useContext } from "react";
import { AppContext } from "../Context/appContext";
import API from "../Api/axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const { BackendUrl } = useContext(AppContext);
  const [formData, setFormData] = useState({
    email: "",
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
      const { data } = await API.post(`/api/auth/resetpassword`, formData);

      if (data.success) {
        toast.success("Email sent");
        navigate("/auth/login");
      } else {
        toast.error(data.message || "Failed to send reset link!");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d0d0d]">
      <div className="bg-white box-border w-[380px] p-10 rounded-2xl shadow-2xl">
        <h2 className="text-center text-[#00e238] text-3xl font-bold mb-4 font-outfit">
          Forgot Password
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          Enter your email address, and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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

          <button
            type="submit"
            className="bg-[#00e238] text-[#0d0d0d] font-semibold py-2 rounded-lg hover:bg-[#00c92f] transition-transform duration-150 hover:-translate-y-0.5"
          >
            Send Reset Link
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Remembered your password?{" "}
          <a
            href="/auth/login"
            className="text-[#00e238] font-medium hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;