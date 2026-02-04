import express from "express";
import { saveAssessmentToSheet } from "../services/googleSheet.service.js";

const router = express.Router();

router.post("/submit", async (req, res) => {
	try {
		const { form, meta, answers } = req.body;

		if (!form || !meta) {
			return res.status(400).json({ message: "Invalid payload" });
		}

		// Save to Google Sheet
		await saveAssessmentToSheet({ form, meta, answers });

		return res.status(200).json({
			message: "Assessment saved successfully",
		});
	} catch (error) {
		console.error("Google Sheet Error:", error);
		return res.status(500).json({
			message: "Failed to save assessment",
		});
	}
});

export default router;
