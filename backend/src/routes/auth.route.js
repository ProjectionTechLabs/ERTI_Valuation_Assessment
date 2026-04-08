import express from "express";
import {
	checkUser,
	sendLoginOtp,
	verifyLoginOtp,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/check-user", checkUser);
router.post("/send-login-otp", sendLoginOtp);
router.post("/verify-login-otp", verifyLoginOtp);

export default router;
