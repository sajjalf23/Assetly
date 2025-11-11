import express from "express";
const authRouter = express.Router()
import { register , signin , googleLogin, logout, resetpassword , getUser} from "../controllers/authController.js"
import { verifySupabaseToken } from "../middleware/verifySupabaseToken.js"

authRouter.post("/register" ,register );
authRouter.post("/signin" ,signin );
authRouter.get("/googleLogin" ,googleLogin);
authRouter.post("/logout" ,verifySupabaseToken,logout);
authRouter.post("/resetPassword" ,resetpassword);
authRouter.get("/user", verifySupabaseToken, getUser);
export default authRouter;