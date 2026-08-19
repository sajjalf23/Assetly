import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../Api/axios";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract access token from URL hash (Supabase recovery flow)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const token = params.get("access_token");

    if (token) {
      setAccessToken(token);
    } else {
      toast.error("Invalid or expired recovery link. Please request a new password reset.");
      setTimeout(() => navigate("/forgot-password"), 3000);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accessToken) {
      return toast.error("Invalid recovery session. Please request a new password reset.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      // Send request to your backend with the recovery token
      const { data } = await API.post(
        "/api/auth/update-forgotten-password",
        {
          newPassword: password,
          confirmPassword: confirmPassword
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      toast.success(data.message || "Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);

    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(error.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    accessToken && (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-[380px]"
        >
          <h2 className="text-green-500 text-2xl mb-4 text-center">Reset Password</h2>

          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    )
  );
};

export default ChangePassword;