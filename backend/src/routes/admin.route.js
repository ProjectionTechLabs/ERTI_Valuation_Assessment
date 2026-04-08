import express from "express";
const router = express.Router();

import {
	createQuestion,
	getQuestions,
	updateQuestion,
	deleteQuestion,
} from "../controllers/admin.controller.js";

// Create question
router.post("/questions", createQuestion);

// Get all questions
router.get("/questions", getQuestions);

// Update question
router.put("/questions/:id", updateQuestion);

// Delete question
router.delete("/questions/:id", deleteQuestion);

export default router;
