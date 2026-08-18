import express from "express";
const authRouter = express.Router()
import { register, signin, googleLogin, logout, resetpassword, getUser, callback, refresh } from "../controllers/authController.js"
import { changePassword } from "../controllers/changePasswordController.js"
import authenticateUser from "../middleware/authMiddleware.js";

authRouter.post("/register", register);
authRouter.post("/signin", signin);
authRouter.get("/googleLogin", googleLogin);
authRouter.post("/logout", authenticateUser, logout);
authRouter.post("/resetPassword", resetpassword);
authRouter.get("/user", authenticateUser, getUser);
authRouter.post("/changePassword", changePassword);
authRouter.get("/callback", callback);
authRouter.post("/refresh", refresh);
export default authRouter;