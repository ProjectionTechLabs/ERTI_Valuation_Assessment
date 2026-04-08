import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import Question from "../models/Question.js";
import PendingAssessment from "../models/PendingAssessment.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import { sendOTP } from "../services/smsService.js";

const generateOtp = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const createToken = (user) => {
	return jwt.sign(
		{
			id: user._id,
			userId: user.userId,
			contact: user.contact,
		},
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES_IN || "7d",
		},
	);
};

const generateNextUserCode = async () => {
	const lastUser = await User.findOne({})
		.sort({ createdAt: -1 })
		.select("userCode")
		.lean();

	let nextNumber = 1;

	if (lastUser?.userCode) {
		const parsed = parseInt(lastUser.userCode, 10);
		if (!Number.isNaN(parsed)) {
			nextNumber = parsed + 1;
		}
	}

	return String(nextNumber).padStart(6, "0");
};

// POST /api/register/start
export const startRegistration = async (req, res) => {
	try {
		const {
			fname,
			lname,
			email,
			contact,
			companyName,
			companySize,
			companyLocation,
			companyIndustry,
			businessType,
			productsServices,
		} = req.body;

		if (!fname || !lname || !email || !contact) {
			return res.status(400).json({
				success: false,
				message: "fname, lname, email and contact are required",
			});
		}

		const existingUser = await User.findOne({ contact }).lean();

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "User already exists. Please login.",
			});
		}

		const sessionId = `REG${Date.now()}`;

		const pending = await PendingAssessment.create({
			sessionId,
			fname,
			lname,
			email,
			contact,
			companyName: companyName || "",
			companySize: companySize || "",
			companyLocation: companyLocation || "",
			companyIndustry: companyIndustry || "",
			businessType: businessType || "",
			productsServices: productsServices || "",
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		});

		return res.status(201).json({
			success: true,
			message: "Registration started successfully",
			data: {
				sessionId: pending.sessionId,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// GET /api/register/questions
export const getQuestions = async (req, res) => {
	try {
		const questions = await Question.find({ isActive: true }).lean();

		return res.status(200).json({
			success: true,
			message: "Questions fetched successfully",
			data: questions.map((q) => ({
				questionId: q.questionId,
				quesTitle: q.quesTitle,
				answerData: q.answers.map((a) => ({
					answerId: a.answerId,
					questionId: a.questionId,
					answerTitle: a.answerTitle,
					answerScore: a.answerScore,
				})),
			})),
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST /api/register/submit-assessment
export const submitPendingAssessment = async (req, res) => {
	try {
		const { sessionId, answers } = req.body;

		if (!sessionId) {
			return res.status(400).json({
				success: false,
				message: "sessionId is required",
			});
		}

		if (!Array.isArray(answers)) {
			console.error(
				"❌ Invalid answers format - not an array:",
				typeof answers,
			);
			return res.status(400).json({
				success: false,
				message: "answers must be an array",
			});
		}

		if (answers.length === 0) {
			console.error("❌ Empty answers array received");
			return res.status(400).json({
				success: false,
				message: "Please answer all questions before submitting",
			});
		}

		const pending = await PendingAssessment.findOne({ sessionId });

		if (!pending) {
			console.error("❌ Session not found:", sessionId);
			return res.status(404).json({
				success: false,
				message:
					"Pending session not found or expired. Please start registration again.",
			});
		}

		let totalScore = 0;
		const selectedAnswers = [];

		// Accept answers with pre-calculated scores from frontend
		for (const item of answers) {
			if (!item || !item.questionId) {
				console.warn("⚠️ Skipping invalid answer item:", item);
				continue;
			}

			totalScore += Number(item.answerScore || 0);

			selectedAnswers.push({
				questionId: item.questionId,
				answerId: item.answerId,
				answerScore: Number(item.answerScore || 0),
			});
		}

		if (!selectedAnswers.length) {
			console.error("❌ No valid answers after processing");
			return res.status(400).json({
				success: false,
				message: "No valid answers found. Please answer all questions.",
			});
		}

		pending.answers = selectedAnswers;
		pending.totalScore = totalScore;
		await pending.save();

		console.log(
			`✅ Assessment saved - Session: ${sessionId}, Answers: ${selectedAnswers.length}, Score: ${totalScore}`,
		);

		return res.status(200).json({
			success: true,
			message: "Assessment answers saved successfully",
			data: {
				sessionId: pending.sessionId,
				totalScore: pending.totalScore,
			},
		});
	} catch (error) {
		console.error("❌ Submit assessment error:", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST /api/register/send-otp
export const sendRegisterOtp = async (req, res) => {
	try {
		const { sessionId } = req.body;

		if (!sessionId) {
			return res.status(400).json({
				success: false,
				message: "sessionId is required",
			});
		}

		const pending = await PendingAssessment.findOne({ sessionId });

		if (!pending) {
			return res.status(404).json({
				success: false,
				message: "Pending session not found or expired",
			});
		}

		const otp = generateOtp();

		// Send OTP via SMS
		try {
			const smsResult = await sendOTP(pending.contact, otp);
			console.log(`✅ OTP delivery result:`, smsResult);
		} catch (smsError) {
			console.error("⚠️ SMS sending failed, but OTP created in DB:", smsError);
			// Continue anyway - OTP is saved in DB
		}

		// Save OTP to database
		await Otp.create({
			mobile: pending.contact,
			otp,
			purpose: "register",
			isUsed: false,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		});

		console.log(`✅ OTP sent to ${pending.contact} (Code for testing: ${otp})`);

		return res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			data: {
				contact: pending.contact,
				// For development: show last 2 digits only
				otpHint: `${otp.slice(-2)}XX-`,
			},
		});
	} catch (error) {
		console.error("❌ Send OTP error:", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST /api/register/verify-otp
export const verifyRegisterOtpAndSave = async (req, res) => {
	try {
		const { sessionId, otp } = req.body;

		if (!sessionId || !otp) {
			return res.status(400).json({
				success: false,
				message: "sessionId and otp are required",
			});
		}

		const pending = await PendingAssessment.findOne({ sessionId });

		if (!pending) {
			return res.status(404).json({
				success: false,
				message: "Pending session not found or expired",
			});
		}

		const alreadyExists = await User.findOne({
			contact: pending.contact,
		}).lean();

		if (alreadyExists) {
			return res.status(409).json({
				success: false,
				message: "User already exists. Please login.",
			});
		}

		const otpDoc = await Otp.findOne({
			mobile: pending.contact,
			otp,
			purpose: "register",
			isUsed: false,
			expiresAt: { $gt: new Date() },
		}).sort({ createdAt: -1 });

		if (!otpDoc) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired OTP",
			});
		}

		const userCode = await generateNextUserCode();
		const partnerId = process.env.PARTNER_ID || "ERTI";
		const userId = `${partnerId}${userCode}`;

		otpDoc.isUsed = true;
		await otpDoc.save();

		const user = await User.create({
			userCode,
			userId,
			partnerId,
			validUser: true,
			fname: pending.fname,
			lname: pending.lname,
			email: pending.email,
			contact: pending.contact,
			companyName: pending.companyName,
			companySize: pending.companySize,
			companyLocation: pending.companyLocation,
			companyIndustry: pending.companyIndustry,
			businessType: pending.businessType,
			productsServices: pending.productsServices,
			isMobileVerified: true,
			lastLoginAt: new Date(),
			assessmentAttemptsCount: 1,
			attemptsRemaining: 1,
			firstAttemptDate: new Date(),
			lastAttemptDate: new Date(),
		});

		if (pending.answers.length > 0) {
			await AssessmentAttempt.create({
				user: user._id,
				assessmentDate: new Date(),
				totalScore: pending.totalScore,
				answers: pending.answers,
			});
		}

		await PendingAssessment.deleteOne({ _id: pending._id });

		const token = createToken(user);

		return res.status(200).json({
			success: true,
			message: "OTP verified. User and assessment saved successfully.",
			data: {
				token,
				validUser: true,
				redirectTo: "/result",
				user,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
