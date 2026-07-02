import AssessmentAttempt from "../models/AssessmentAttempt.js";
import {
	applyAttemptWindowReset,
	getAttemptPolicy,
} from "../services/attemptPolicy.js";

// GET /api/assessment/status
export const getAssessmentStatus = async (req, res) => {
	try {
		const user = req.user;
		const wasReset = applyAttemptWindowReset(user);

		if (wasReset) {
			await user.save();
		}

		const { MAX_ATTEMPTS, ATTEMPT_WINDOW_DAYS } = getAttemptPolicy();

		return res.json({
			success: true,
			data: {
				attemptsRemaining: user.attemptsRemaining,
				maxAttempts: MAX_ATTEMPTS,
				attemptWindowDays: ATTEMPT_WINDOW_DAYS,
				canTakeAssessment: user.attemptsRemaining > 0,
			},
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// GET /api/assessment/start
export const startAssessment = async (req, res) => {
	try {
		const user = req.user;
		const wasReset = applyAttemptWindowReset(user);

		if (wasReset) {
			await user.save();
		}

		if (user.attemptsRemaining <= 0) {
			return res.status(400).json({
				message: "No attempts remaining",
			});
		}

		return res.json({
			message: "Assessment started",
			attemptsRemaining: user.attemptsRemaining,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// POST /api/assessment/submit
export const submitAssessment = async (req, res) => {
	try {
		const user = req.user;
		const { answers, totalScore } = req.body;
		const wasReset = applyAttemptWindowReset(user);

		if (wasReset) {
			await user.save();
		}

		if (user.attemptsRemaining <= 0) {
			return res.status(400).json({
				message: "No attempts remaining",
			});
		}

		// first attempt date
		if (!user.firstAttemptDate) {
			user.firstAttemptDate = new Date();
		}

		user.assessmentAttemptsCount += 1;
		user.attemptsRemaining -= 1;
		user.lastAttemptDate = new Date();

		await user.save();

		await AssessmentAttempt.create({
			user: user._id,
			assessmentDate: new Date(),
			totalScore,
			answers,
		});

		return res.json({
			message: "Assessment submitted",
			attemptsRemaining: user.attemptsRemaining,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// GET /api/assessment/history
export const getAssessmentHistory = async (req, res) => {
	try {
		const attempts = await AssessmentAttempt.find({
			user: req.user._id,
		}).sort({ createdAt: -1 });

		return res.json({
			success: true,
			data: attempts,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};
