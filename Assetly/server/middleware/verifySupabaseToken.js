import supabase from '../config/supabaseClient.js';

export const verifySupabaseToken = async (req, res, next) => {
  console.log("Middleware started");
  try {
    const authHeader = req.headers.authorization;
    console.log("Header:", authHeader);
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token:", token.substring(0, 20));
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    console.log("Error:", error);
    console.log("User:", data.user?.id);

    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    req.user = data.user;

    console.log("Calling next()");
    next(); 
  } catch (err) {
    console.error("Error verifying Supabase token:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
