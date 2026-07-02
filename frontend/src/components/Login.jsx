import React, { useState } from "react";
import { checkUser } from "../utils/auth";

function Login({ onRedirectToRegister, onLoginSuccess }) {
	const [email, setEmail] = useState("");
	const [mobile, setMobile] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async () => {
		const normalizedEmail = email.trim().toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setError("Enter a valid email address");
			return;
		}

		if (!/^[6-9]\d{9}$/.test(mobile)) {
			setError("Enter a valid 10-digit mobile number");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await checkUser(normalizedEmail, mobile);

			if (res.data.success) {
				if (res.data.data.exists) {
					onLoginSuccess(res.data.data);
				} else {
					onRedirectToRegister({
						email: normalizedEmail,
						mobile,
					});
				}
			}
		} catch (err) {
			setError(err.response?.data?.message || "Unable to continue");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex">
			<div className="hidden md:flex w-1/2 bg-linear-to-br from-blue-700 via-sky-700 to-cyan-700 text-white items-center justify-center p-10 relative overflow-hidden">
				<div className="absolute inset-0 opacity-20">
					<div className="absolute -top-14 -left-8 h-48 w-48 rounded-full bg-white blur-3xl"></div>
					<div className="absolute top-1/3 right-0 h-56 w-56 rounded-full bg-cyan-200 blur-3xl"></div>
					<div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-blue-200 blur-2xl"></div>
				</div>
				<div className="max-w-md text-center relative z-10">
					<div className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium tracking-wide mb-6">
						eRaised Valuation Readiness
					</div>
					<h1 className="text-5xl font-bold mb-4 leading-tight">
						Access Your Business Result
					</h1>
					<p className="text-lg opacity-90 mb-8 leading-relaxed">
						Use your registered email address and mobile number to open your
						valuation enhancement report.
					</p>
					<div className="grid grid-cols-3 gap-4 text-left">
						<div className="rounded-2xl bg-white/10 border border-white/20 p-4">
							<div className="text-2xl font-bold">7</div>
							<div className="text-sm opacity-80">Strategic pillars</div>
						</div>
						<div className="rounded-2xl bg-white/10 border border-white/20 p-4">
							<div className="text-2xl font-bold">14</div>
							<div className="text-sm opacity-80">Assessment prompts</div>
						</div>
						<div className="rounded-2xl bg-white/10 border border-white/20 p-4">
							<div className="text-2xl font-bold">3</div>
							<div className="text-sm opacity-80">Attempts in 21 days</div>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full md:w-1/2 flex items-center justify-center bg-linear-to-br from-slate-50 to-blue-50 p-6">
				<div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-blue-100">
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-100 text-blue-700 text-2xl mb-4">
							{"->"}
						</div>
						<h2 className="text-2xl font-bold text-center text-gray-800">
							Login
						</h2>
						<p className="text-sm text-gray-600 text-center mt-2">
							Enter your registered email address and mobile number to continue
						</p>
					</div>

					<input
						type="email"
						placeholder="Enter your email address"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							setError("");
						}}
						className="w-full border-2 border-gray-200 p-3.5 rounded-xl mb-4 focus:outline-none focus:border-blue-500 bg-slate-50"
					/>

					<input
						type="tel"
						placeholder="Enter 10-digit mobile number"
						value={mobile}
						onChange={(e) => {
							setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
							setError("");
						}}
						maxLength="10"
						className="w-full border-2 border-gray-200 p-3.5 rounded-xl mb-4 focus:outline-none focus:border-blue-500 bg-slate-50"
					/>

					{error && (
						<div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
							{error}
						</div>
					)}

					<button
						onClick={handleSubmit}
						disabled={!email.trim() || !mobile || loading}
						className="w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-3.5 rounded-xl transition font-semibold disabled:opacity-50"
					>
						{loading ? "Checking..." : "Continue"}
					</button>

					<p className="text-sm text-gray-500 text-center mt-4">
						If your account is not found, you can{" "}
						<button
							type="button"
							onClick={() =>
								onRedirectToRegister({
									email: email.trim().toLowerCase(),
									mobile,
								})
							}
							className="font-semibold text-blue-600 hover:text-blue-700"
						>
							register here
						</button>
						.
					</p>
				</div>
			</div>
		</div>
	);
}

export default Login;
