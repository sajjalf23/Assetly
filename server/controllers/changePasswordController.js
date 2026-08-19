import supabase from '../config/supabaseClient.js';

export const changePassword = async (req, res) => {
    try {
        // Now this will work because we add authenticateUser middleware
        const userId = req.user.id;
        const email = req.user.email;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: currentPassword
        });

        if (signInError) {
            return res.status(401).json({
                success: false,
                message: "Incorrect current password"
            });
        }

        // Update password using admin API (bypasses session issues)
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            {
                password: newPassword
            }
        );

        if (updateError) {
            console.error('Supabase update error:', updateError);
            return res.status(500).json({
                success: false,
                message: "Failed to update password. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password updated successfully!"
        });

    } catch (err) {
        console.error('Error changing password:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Failed to update password'
        });
    }
};

// NEW: Forgot password - sends reset email
export const resetpassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Configure where the user will be redirected after clicking the email link
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/auth/change-password`,
        });

        if (error) {
            console.error('Reset password error:', error);
            return res.status(400).json({
                success: false,
                message: error.message || "Failed to send reset email"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset email sent! Please check your inbox."
        });

    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to process request"
        });
    }
};

// NEW: Update password after forgot password flow
export const updateForgottenPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;

        // Get the access token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "No recovery session found"
            });
        }

        const accessToken = authHeader.split(' ')[1];

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // Get user from the access token
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired recovery session. Please request a new password reset."
            });
        }

        // Update password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
                password: newPassword
            }
        );

        if (updateError) {
            console.error('Update error:', updateError);
            return res.status(500).json({
                success: false,
                message: "Failed to update password. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset successfully! Please log in with your new password."
        });

    } catch (err) {
        console.error('Update forgotten password error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || "Failed to reset password"
        });
    }
};