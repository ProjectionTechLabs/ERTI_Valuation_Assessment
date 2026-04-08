import express from "express";
import {
	startRegistration,
	getQuestions,
	submitPendingAssessment,
	sendRegisterOtp,
	verifyRegisterOtpAndSave,
} from "../controllers/register.controller.js";

const router = express.Router();

router.post("/start", startRegistration);
router.get("/questions", getQuestions);
router.post("/submit-assessment", submitPendingAssessment);
router.post("/send-otp", sendRegisterOtp);
router.post("/verify-otp", verifyRegisterOtpAndSave);

export default router;
