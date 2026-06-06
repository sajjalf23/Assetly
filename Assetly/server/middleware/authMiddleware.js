import supabase from '../config/supabaseClient.js';
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication token required" 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired token" 
            });
        }

        // Attach user to request object
        req.user = {
            id: user.id,
            email: user.email,
            ...user.user_metadata
        };

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error during authentication" 
        });
    }
};

export default authenticateUser;