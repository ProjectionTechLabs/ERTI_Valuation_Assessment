import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
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

// POST /api/auth/check-user
export const checkUser = async (req, res) => {
	try {
		const { mobile } = req.body;

		if (!mobile) {
			return res.status(400).json({
				success: false,
				message: "Mobile number is required",
			});
		}

		const user = await User.findOne({ contact: mobile }).lean();

		if (user) {
			return res.status(200).json({
				success: true,
				message: "User exists",
				data: {
					exists: true,
					userId: user.userId,
					validUser: user.validUser,
					contact: user.contact,
				},
			});
		}

		return res.status(200).json({
			success: true,
			message: "User not found",
			data: {
				exists: false,
				redirectTo: "/register",
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST /api/auth/send-login-otp
export const sendLoginOtp = async (req, res) => {
	try {
		const { mobile } = req.body;

		if (!mobile) {
			return res.status(400).json({
				success: false,
				message: "Mobile number is required",
			});
		}

		const user = await User.findOne({ contact: mobile });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		const otp = generateOtp();

		// Send OTP via SMS
		try {
			const smsResult = await sendOTP(mobile, otp);
			console.log(`✅ OTP delivery result:`, smsResult);
		} catch (smsError) {
			console.error("⚠️ SMS sending failed, but OTP created in DB:", smsError);
			// Continue anyway - OTP is saved in DB
		}

		// Save OTP to database
		await Otp.create({
			mobile,
			otp,
			purpose: "login",
			isUsed: false,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		});

		console.log(`✅ Login OTP sent to ${mobile} (Code for testing: ${otp})`);

		return res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			data: {
				contact: mobile,
				// For development: show last 2 digits only
				otpHint: `${otp.slice(-2)}XX-`,
			},
		});
	} catch (error) {
		console.error("❌ Send login OTP error:", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// POST /api/auth/verify-login-otp
export const verifyLoginOtp = async (req, res) => {
	try {
		const { mobile, otp } = req.body;

		if (!mobile || !otp) {
			return res.status(400).json({
				success: false,
				message: "Mobile and OTP are required",
			});
		}

		const otpDoc = await Otp.findOne({
			mobile,
			otp,
			purpose: "login",
			isUsed: false,
			expiresAt: { $gt: new Date() },
		}).sort({ createdAt: -1 });

		if (!otpDoc) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired OTP",
			});
		}

		const user = await User.findOne({ contact: mobile });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		otpDoc.isUsed = true;
		await otpDoc.save();

		user.lastLoginAt = new Date();

		// 🔥 ATTEMPT RESET LOGIC (21 days)
		if (user.firstAttemptDate) {
			const diffDays =
				(new Date() - new Date(user.firstAttemptDate)) / (1000 * 60 * 60 * 24);

			if (diffDays > 21) {
				user.assessmentAttemptsCount = 0;
				user.attemptsRemaining = 2;
				user.firstAttemptDate = null;
			}
		}

		await user.save();

		const token = createToken(user);

		return res.json({
			success: true,
			message: "Login successful",
			data: {
				token,
				user,
				attemptsRemaining: user.attemptsRemaining,
				canTakeAssessment: user.attemptsRemaining > 0,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
