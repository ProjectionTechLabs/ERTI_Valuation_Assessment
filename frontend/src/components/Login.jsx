import React, { useState } from "react";
import { checkUser, sendLoginOTP } from "../utils/auth";

function Login({ onRedirectToRegister, onOTPRequired }) {
	const [mobile, setMobile] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleMobileSubmit = async () => {
		if (mobile.length !== 10) {
			setError("Enter valid 10-digit mobile number");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await checkUser(mobile);

			if (res.data.success) {
				if (res.data.data.exists) {
					const otpRes = await sendLoginOTP(mobile);
					if (otpRes.data.success) {
						onOTPRequired(mobile);
					}
				} else {
					onRedirectToRegister(mobile);
				}
			}
		} catch (err) {
			setError(err.response?.data?.message || "Error checking user");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* LEFT SIDE */}
			<div className="hidden md:flex w-1/2 bg-linear-to-br from-blue-600 to-indigo-700 text-white items-center justify-center p-10">
				<div className="max-w-md text-center">
					<h1 className="text-4xl font-bold mb-4">Valuation Assessment</h1>

					<p className="text-lg opacity-90 mb-6">
						Understand your business value through Chanakya’s Saptang Framework.
					</p>

					{/* SVG Illustration */}
					<div className="mt-6">
						<svg viewBox="0 0 500 300" className="w-full opacity-90">
							<circle cx="150" cy="150" r="80" fill="white" opacity="0.1" />
							<circle cx="300" cy="120" r="60" fill="white" opacity="0.1" />
							<circle cx="350" cy="220" r="40" fill="white" opacity="0.1" />
						</svg>
					</div>
				</div>
			</div>

			{/* RIGHT SIDE */}
			<div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50">
				<div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
					<h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
						Login
					</h2>

					<p className="text-sm text-gray-600 text-center mb-4">
						Enter your mobile number to continue
					</p>

					<input
						type="tel"
						placeholder="Enter 10-digit mobile number"
						value={mobile}
						onChange={(e) => {
							setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
							setError("");
						}}
						maxLength="10"
						className="w-full border-2 border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:border-blue-500"
					/>

					{error && (
						<div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
							{error}
						</div>
					)}

					<button
						onClick={handleMobileSubmit}
						disabled={mobile.length !== 10 || loading}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50"
					>
						{loading ? "Checking..." : "Continue"}
					</button>

					<p className="text-xs text-gray-500 text-center mt-4">
						If your number already exists, we will send an OTP. Otherwise, we will
						take you to registration.
					</p>
				</div>
			</div>
		</div>
	);
}

export default Login;
