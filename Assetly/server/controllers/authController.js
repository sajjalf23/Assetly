import supabase from '../config/supabaseClient.js'


export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: "Enter all required fields"
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });

        console.log("SignUp data:", data);
console.log("SignUp error:", error);

        if (error) throw error;

        return res.status(201).json({
            success: true,
            user: data.user,
            session: data.session,
            message: "Signup successful! Check your email."
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


export const signin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Enter all Required Fields" });
    }
    const { data, error } = await supabase.auth.admin.listUsers({
        filter: `email=eq.${email}`
    });

    if (error) throw error;

    if (!data?.users?.length) {
        return res.status(400).json({ success: false, message: "Email not registered" });
    }

    const user = data.users[0];
    if (!user.email_confirmed_at) {
        return res.status(400).json({ success: false, message: "Please confirm your email before logging in" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error

        res.status(201).json({
            success: true,
            session: data.session,
            user: data.user,
            message: 'Successfully SignIn, Welcome to Assetly',
        })
    } catch (err) {
        res.status(500).json({ success: false, message: err?.response?.data?.error || err.message })
    }

}

export const googleLogin = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {redirectTo: process.env.CLIENT_ORIGIN + '/auth/callback' }

        })
        if (error) throw error
         res.status(200).json({ url: data.url });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }
}



export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token missing" });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return res.status(401).json({ success: false, message: "Invalid token" });

    const userId = userData.user.id;

    const { error: revokeError } = await supabase.auth.admin.api.revokeUserRefreshTokens(userId);
    if (revokeError) throw revokeError;

    res.status(200).json({ success: true, message: "Successfully logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Logout failed. Try again." });
  }
};


export const resetpassword = async( req, res)=>{
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Enter all Required Fields" });
    }

     try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(
            email , { redirectTo: process.env.CLIENT_ORIGIN + '/auth/change-password' }
        )
        if (error) throw error
        res.status(200).json({
            success:true,
            message: 'Password reset email sent. Check your inbox.',
            data
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message })
    }
}


export const getUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    let username = req.user.user_metadata?.username;

    if (!username && req.user.email) {

      const fullName = req.user.user_metadata?.full_name || "";

      const firstName =
        fullName.split(" ")[0].toLowerCase();

      username = firstName;

      // Get all users
      const { data, error } =
        await supabase.auth.admin.listUsers();

      if (error) throw error;

      // Check if username already exists
      const usernameExists = data.users.some(
        (user) =>
          user.user_metadata?.username === username
      );

      // If exists add random numbers
      if (usernameExists) {
        username =
          firstName +
          Math.floor(1000 + Math.random() * 9000);
      }

      // Save username permanently
      await supabase.auth.admin.updateUserById(
        req.user.id,
        {
          user_metadata: {
            ...req.user.user_metadata,
            username,
          },
        }
      );
    }

    const flatUser = {
      id: req.user.id,
      email: req.user.email,
      username,
    };

    res.status(200).json({
      success: true,
      user: flatUser,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};