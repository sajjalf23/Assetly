import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createClient } from "@supabase/supabase-js";


const ChangePassword = () => {

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const token = params.get("access_token");
    if (token) setAccessToken(token);
    else toast.error("Missing access token!");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) return toast.error("Cannot reset password without token.");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error("Password reset failed: " + error.message);
    } else {
      toast.success("Password reset successfully!");
      navigate("/auth/login");
    }
  };

  return (
    accessToken &&(
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
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          type="submit"
          className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Reset Password
        </button>
      </form>
    </div>
    )
  );
};

export default ChangePassword;
