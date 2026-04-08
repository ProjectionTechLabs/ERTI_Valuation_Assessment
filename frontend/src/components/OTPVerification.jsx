import React, { useState } from "react";
import {
	verifyRegisterOTP,
	verifyLoginOTP,
	sendRegisterOTP,
	sendLoginOTP,
} from "../utils/auth";

function OTPVerification({
	sessionId,
	mobile,
	source = "register",
	onOTPVerified,
	onSkip,
}) {
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [attemptsLeft, setAttemptsLeft] = useState(3);

	const handleVerifyOTP = async () => {
		if (!otp || otp.length !== 6) {
			setError("Please enter a valid 6-digit OTP");
			return;
		}

		setLoading(true);
		setError("");

		try {
			let res;

			if (source === "register") {
				res = await verifyRegisterOTP(sessionId, otp);
			} else {
				res = await verifyLoginOTP(mobile, otp);
			}

			if (res.data.success) {
				if (res.data.data?.token) {
					localStorage.setItem("token", res.data.data.token);
				}
				onOTPVerified(res.data.data);
			}
		} catch (err) {
			const message = err.response?.data?.message || "OTP verification failed";
			setError(message);
			setAttemptsLeft((prev) => Math.max(prev - 1, 0));
		} finally {
			setLoading(false);
		}
	};

	const handleResendOTP = async () => {
		setLoading(true);
		setError("");

		try {
			if (source === "register") {
				await sendRegisterOTP(sessionId);
			} else {
				await sendLoginOTP(mobile);
			}

			alert("OTP resent successfully!");
		} catch (err) {
			const message = err.response?.data?.message || "Failed to resend OTP";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	const handleSkipOTP = () => {
		if (onSkip) {
			onSkip();
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				<div className="text-center mb-6">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-800 mb-2">
						Verify Your OTP
					</h2>
					<p className="text-gray-600">
						We've sent an OTP to <span className="font-semibold">{mobile}</span>
					</p>
				</div>

				<div className="space-y-4">
					<input
						type="text"
						inputMode="numeric"
						placeholder="Enter 6-digit OTP"
						maxLength="6"
						value={otp}
						onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
						className="w-full border-2 border-gray-300 p-3 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-green-500"
					/>

					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
							{error}
						</div>
					)}

					{attemptsLeft <= 1 && (
						<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg text-sm">
							⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
						</div>
					)}

					<button
						onClick={handleVerifyOTP}
						disabled={loading || otp.length !== 6 || attemptsLeft <= 0}
						className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50"
					>
						{loading ? "Verifying..." : "Verify OTP"}
					</button>

					<button
						onClick={handleResendOTP}
						disabled={loading}
						className="w-full text-green-600 hover:text-green-700 p-3 rounded-lg transition font-semibold border-2 border-green-600 hover:bg-green-50"
					>
						Resend OTP
					</button>

					{source === "register" && (
						<>
							<div className="relative py-2">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-white text-gray-500">or</span>
								</div>
							</div>

							<button
								onClick={handleSkipOTP}
								className="w-full text-gray-600 hover:text-gray-700 p-3 rounded-lg transition font-semibold border-2 border-gray-400 hover:bg-gray-50"
							>
								Skip And View Preview
							</button>
						</>
					)}
				</div>

				<p className="text-center text-gray-500 text-sm mt-6">
					Enter the OTP received on your mobile number.
				</p>
			</div>
		</div>
	);
}

export default OTPVerification;
