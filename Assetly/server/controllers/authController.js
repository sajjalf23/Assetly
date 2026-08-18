import supabase from '../config/supabaseClient.js'; // must be created with the SERVICE ROLE key on the backend

const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth', // scope cookie to auth routes only
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, match your Supabase refresh token expiry
};

// =========================================================
// REGISTER
// =========================================================
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
            options: { data: { username } }
        });

        if (error) throw error;

        return res.status(201).json({
            success: true,
            user: data.user,
            message: "Signup successful! Check your email."
            // NOTE: not returning data.session here on purpose — until email is
            // confirmed you don't want a usable session floating around. 
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// =========================================================
// SIGNIN (password)
// =========================================================
export const signin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Enter all required fields" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            // signInWithPassword already fails correctly for unconfirmed/wrong
            // password/nonexistent email.
            return res.status(400).json({ success: false, message: error.message });
        }

        res.cookie('refresh_token', data.session.refresh_token, REFRESH_COOKIE_OPTS);

        return res.status(200).json({
            success: true,
            access_token: data.session.access_token,
            expires_at: data.session.expires_at,
            user: data.user,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =========================================================
// REFRESH
// =========================================================
export const refresh = async (req, res) => {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token) {
        return res.status(401).json({ success: false, message: "No refresh token" });
    }

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        if (error || !data.session) {
            res.clearCookie('refresh_token', REFRESH_COOKIE_OPTS);
            return res.status(401).json({ success: false, message: "Session expired, please log in again" });
        }

        // Supabase rolls refresh token so better to get the new one and set it in the cookie.
        res.cookie('refresh_token', data.session.refresh_token, REFRESH_COOKIE_OPTS);

        return res.status(200).json({
            success: true,
            access_token: data.session.access_token,
            expires_at: data.session.expires_at,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// =========================================================
// GOOGLE LOGIN (start OAuth flow)
// =========================================================
export const googleLogin = async (req, res) => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: process.env.SERVER_ORIGIN + '/api/auth/callback',
                // redirect to YOUR BACKEND callback, not the frontend directly —
                // your backend needs to exchange the code and set the cookie
                // before the browser ever lands on the frontend.
            }
        });
        if (error) throw error;
        res.status(200).json({ success: true, url: data.url });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// =========================================================
// GOOGLE OAUTH CALLBACK (Supabase redirects here with ?code=)
// =========================================================
export const callback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=oauth_failed`);
    }

    try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error || !data.session) {
            return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=oauth_failed`);
        }

        res.cookie('refresh_token', data.session.refresh_token, REFRESH_COOKIE_OPTS);

        // Access token can't safely go in the redirect URL (it'd land in
        // browser history / server logs), so send the browser back with just
        // a flag, and have the frontend immediately call POST /api/auth/refresh
        // to pull the access token into memory using the cookie you just set.
        res.redirect(`${process.env.CLIENT_ORIGIN}/auth/callback?login=success`);
    } catch (err) {
        res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=oauth_failed`);
    }
};

// =========================================================
// LOGOUT
// =========================================================
export const logout = async (req, res) => {
    try {
        const refresh_token = req.cookies?.refresh_token;
        if (refresh_token) {
            await supabase.auth.admin.signOut(refresh_token).catch(() => { });
        }
        res.clearCookie('refresh_token', REFRESH_COOKIE_OPTS);
        return res.status(200).json({ success: true, message: "Logged out" });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ success: false, message: "Logout failed. Try again." });
    }
};

// =========================================================
// RESET PASSWORD
// =========================================================
export const resetpassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Enter all required fields" });
    }

    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(
            email,
            { redirectTo: process.env.CLIENT_ORIGIN + '/auth/change-password' }
        );
        if (error) throw error;
        res.status(200).json({
            success: true,
            message: 'Password reset email sent. Check your inbox.',
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// =========================================================
// GET USER (uses req.user set by authMiddleware — unchanged)
// =========================================================
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
            const firstName = fullName.split(" ")[0].toLowerCase();
            username = firstName;

            const { data, error } = await supabase.auth.admin.listUsers();
            if (error) throw error;

            const usernameExists = data.users.some(
                (user) => user.user_metadata?.username === username
            );

            if (usernameExists) {
                username = firstName + Math.floor(1000 + Math.random() * 9000);
            }

            await supabase.auth.admin.updateUserById(req.user.id, {
                user_metadata: { ...req.user.user_metadata, username },
            });
        }

        const flatUser = {
            id: req.user.id,
            email: req.user.email,
            username,
        };

        res.status(200).json({ success: true, user: flatUser });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};