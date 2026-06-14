import supabase from '../config/supabaseClient.js';


exports.changePassword = async (req, res) => {
    try {
        const user = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" })
        }

        if (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Invalid input or passwords do not match." })
        }

        // verifying if the given user password matches the one stored in db by signing the user in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: req.user.email,
            password: currentPassword
        })

        // If this throws an error, it means the "current password" they typed is wrong
        if (signInError) {
            return res.status(401).json({
                success: false,
                message: "Incorrect current password"
            });
        }

        // update to new password
        const { data, error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) throw updateError;

        res.status(200).json({
            success: true,
            message: "Password updated successfully!"
        });
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to update password'
        });
    }
}