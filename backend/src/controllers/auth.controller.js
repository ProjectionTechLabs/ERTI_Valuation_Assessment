import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendOTP } from "../services/smsService.js";
import {
	applyAttemptWindowReset,
	getAttemptPolicy,
} from "../services/attemptPolicy.js";

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

const buildAuthPayload = (user, token) => {
	const { MAX_ATTEMPTS, ATTEMPT_WINDOW_DAYS } = getAttemptPolicy();

	return {
		token,
		user,
		userId: user.userId,
		validUser: user.validUser,
		contact: user.contact,
		email: user.email,
		attemptsRemaining: user.attemptsRemaining,
		maxAttempts: MAX_ATTEMPTS,
		attemptWindowDays: ATTEMPT_WINDOW_DAYS,
		canTakeAssessment: user.attemptsRemaining > 0,
	};
};

// POST /api/auth/check-user
export const checkUser = async (req, res) => {
	try {
		const { email, mobile } = req.body;

		if (!email || !mobile) {
			return res.status(400).json({
				success: false,
				message: "Email and mobile number are required",
			});
		}

		const normalizedEmail = email.trim().toLowerCase();
		const normalizedMobile = mobile.trim();

		const user = await User.findOne({
			email: normalizedEmail,
			contact: normalizedMobile,
		});

		if (!user) {
			return res.status(200).json({
				success: true,
				message: "User not found",
				data: {
					exists: false,
					redirectTo: "/register",
				},
			});
		}

		applyAttemptWindowReset(user);
		user.lastLoginAt = new Date();
		await user.save();

		const token = createToken(user);

		return res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				exists: true,
				...buildAuthPayload(user, token),
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

		try {
			const smsResult = await sendOTP(mobile, otp);
			console.log("OTP delivery result:", smsResult);
		} catch (smsError) {
			console.error("SMS sending failed, but OTP created in DB:", smsError);
		}

		await Otp.create({
			mobile,
			otp,
			purpose: "login",
			isUsed: false,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		});

		console.log(`Login OTP sent to ${mobile} (Code for testing: ${otp})`);

		return res.status(200).json({
			success: true,
			message: "OTP sent successfully",
			data: {
				contact: mobile,
				otpHint: `${otp.slice(-2)}XX-`,
			},
		});
	} catch (error) {
		console.error("Send login OTP error:", error);
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

		applyAttemptWindowReset(user);
		user.lastLoginAt = new Date();
		await user.save();

		const token = createToken(user);

		return res.json({
			success: true,
			message: "Login successful",
			data: buildAuthPayload(user, token),
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
