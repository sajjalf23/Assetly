import supabase from '../config/supabaseClient.js'


export const register = async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ success: false, message: "Enter all Required Fields" });
    }
    const { data, error } = await supabase.auth.admin.listUsers({
        filter: `email=eq.${email}`
    });

    if (error) {
        throw error; 
    }

    if (data?.users?.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Email already registered"
        });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username }
            }
        })
        if (error) throw error

        res.status(201).json({
            success: true,
            user: data.user,
            message: 'Signup successful! Check your email for verification.',
        })
    } catch (err) {
        res.status(500).json({ success: false, error: err.message })
    }

}


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

// export const logout = async (req, res) => {
//     try {
//         const { error } = await supabase.auth.signOut()
//         if (error)
//             throw error
//         res.status(200).json({
//             success: true,
//             message: 'Successfully Logged Out',
//         })
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({ error: err.message })
//     }
// }

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
    // console.error("Logout error:", err);
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
        // console.error(err)
        res.status(500).json({ error: err.message })
    }
}

// export const getUser = async (req, res) => {
//   try {
//     const user = req.user; 

//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }
     
//     const flatUser = {
//       id: user.id,
//       email: user.email,
//       username: user.user_metadata?.username || null,
//     };

//     res.status(200).json({
//       success: true,
//       user : flatUser,
//     });
    
//   } catch (err) {
//     console.error("Error fetching user:", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// export const getUser = async (req, res) => {
//   try {
//     const user = req.user; 

//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not authenticated" });
//     }

//     // Supabase stores custom data in `user_metadata`
//     const flatUser = {
//       id: user.sub, // decoded JWT has `sub` as user id
//       email: user.email,
//       username: user.user_metadata?.username || user.user_metadata?.name || null,
//     };

//     res.status(200).json({
//       success: true,
//       user: flatUser,
//     });
    
//   } catch (err) {
//     console.error("Error fetching user:", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

export const getUser = (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "User not authenticated" });

    const flatUser = {
      id: req.user.sub || req.user.id,
      email: req.user.email,
      username: req.user.user_metadata?.username || null,
    };

    res.status(200).json({ success: true, user: flatUser });
  } catch (err) {
    // console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// export const getUser = async (req, res) => {
//   try {

//     if (!req.user)
//       return res.status(401).json({ success: false, message: "User not authenticated" });

//     const flatUser = {
//       id: req.user.sub || req.user.id,
//       email: req.user.email,
//       username: req.user.user_metadata?.username || null,
//     };

//     res.status(200).json({ success: true, user: flatUser });
//   } catch (err) {
//     console.error("Error fetching user:", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };
