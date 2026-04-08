import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
	getAssessmentStatus,
	startAssessment,
	submitAssessment,
	getAssessmentHistory,
} from "../controllers/assessment.controller.js";

const router = express.Router();

router.get("/status", authMiddleware, getAssessmentStatus);
router.get("/start", authMiddleware, startAssessment);
router.post("/submit", authMiddleware, submitAssessment);
router.get("/history", authMiddleware, getAssessmentHistory);

export default router;
