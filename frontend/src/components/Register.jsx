import React, { useState } from "react";
import api from "../utils/client";
import { questions as allQuestions } from "../utils/questions";
import { buildReportData } from "../utils/reportData";

const getStageFromVRI = (vri) => {
	if (vri <= 40) return "Foundation Stage";
	if (vri <= 60) return "Structured Stage";
	if (vri <= 80) return "Scalable Stage";
	return "Valuation Ready";
};

function Register({ mobile, onOTPPageSuccess }) {
	const [step, setStep] = useState("form"); // form or questions
	const [sessionId, setSessionId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState([]);

	const [formData, setFormData] = useState({
		fname: "",
		lname: "",
		email: "",
		companyName: "",
		businessType: "",
		productsServices: "",
	});

	// Step 1: Submit registration form
	const handleFormSubmit = async () => {
		if (
			!formData.fname ||
			!formData.lname ||
			!formData.email ||
			!formData.businessType ||
			!formData.productsServices
		) {
			alert("Please fill all required fields");
			return;
		}

		setLoading(true);
		try {
			const res = await api.post("/register/start", {
				fname: formData.fname,
				lname: formData.lname,
				email: formData.email,
				contact: mobile,
				companyName: formData.companyName,
				businessType: formData.businessType,
				productsServices: formData.productsServices,
			});

			if (res.data.success) {
				setSessionId(res.data.data.sessionId);
				setStep("questions");
			}
		} catch (err) {
			alert(err.response?.data?.message || "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	// Step 2: Answer questions
	const currentQuestion = allQuestions[currentQuestionIndex];

	const handleAnswerSelect = (answerId, answerLabel) => {
		const newAnswers = [...answers];
		const q = allQuestions[currentQuestionIndex];

		// For numeric_bucket, calculate score based on the value
		let score = 0;
		if (q.type === "numeric_bucket") {
			const num = Number(answerId);
			const rules = q.scoringLogic || [];
			for (const r of rules) {
				const [min, max] = r.range;
				if (num >= min && num <= max) {
					score = r.value;
					break;
				}
			}
		} else {
			// For single_choice and scale, the score is the answerId itself
			score = Number(answerId);
		}

		newAnswers[currentQuestionIndex] = {
			questionId: q.id,
			answerId: answerId,
			answerTitle: answerLabel,
			answerScore: score,
		};
		setAnswers(newAnswers);
	};

	// Step 3: Submit answers and move to OTP
	const handleSubmitAnswers = async () => {
		if (!sessionId) return;

		// Validate all questions are answered
		const answeredCount = answers.filter((a) => a).length;
		if (answeredCount !== allQuestions.length) {
			alert(
				`Please answer all questions. You have answered ${answeredCount} out of ${allQuestions.length} questions.`,
			);
			return;
		}

		setLoading(true);
		try {
			// Convert sparse array to dense array, ensuring only valid answers
			const validAnswers = answers.filter(
				(a) => a && a.questionId && a.answerId !== undefined,
			);

			console.log("Submitting answers:", {
				sessionId,
				answersCount: validAnswers.length,
				answers: validAnswers,
			});

			const res = await api.post("/register/submit-assessment", {
				sessionId,
				answers: validAnswers,
			});

			if (res.data.success) {
				const reportData = buildReportData({
					form: {
						firstName: formData.fname,
						lastName: formData.lname,
						contact: mobile,
						email: formData.email,
						companyName: formData.companyName,
						industry: "",
						city: "",
						businessType: formData.businessType,
						teamSize: "",
						isFounder: "",
						founderName: "",
						founderEmail: "",
						founderContact: "",
						productsServices: formData.productsServices,
					},
					answers: validAnswers,
				});

				await api.post("/form/submit", {
					form: reportData.form,
					meta: {
						VRI: reportData.VRI,
						stage: getStageFromVRI(reportData.VRI),
						pillars: reportData.pillarRows,
					},
					answers: reportData.answersArr,
				});

				// Send OTP
				const otpRes = await api.post("/register/send-otp", {
					sessionId,
				});

				if (otpRes.data.success) {
					onOTPPageSuccess({
						sessionId,
						mobile,
						reportData,
					});
				}
			}
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || "Failed to submit answers";
			console.error("Submit error:", err.response?.data);
			alert(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleNextQuestion = () => {
		if (currentQuestionIndex < allQuestions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		} else {
			handleSubmitAnswers();
		}
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-indigo-50 p-4 md:p-8">
			{step === "form" && (
				<div className="max-w-md mx-auto">
					<div className="bg-white rounded-2xl shadow-xl p-8">
						{/* Header */}
						<div className="text-center mb-8">
							<div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
								<span className="text-2xl">📝</span>
							</div>
							<h2 className="text-3xl font-bold text-gray-800 mb-2">
								Create Your Account
							</h2>
							<p className="text-gray-600">
								Join us and assess your business readiness
							</p>
						</div>

						{/* Form Fields */}
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									First Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Your first name"
									value={formData.fname}
									onChange={(e) =>
										setFormData({ ...formData, fname: e.target.value })
									}
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Last Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="Your last name"
									value={formData.lname}
									onChange={(e) =>
										setFormData({ ...formData, lname: e.target.value })
									}
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Email Address <span className="text-red-500">*</span>
								</label>
								<input
									type="email"
									placeholder="your.email@company.com"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Company Name
								</label>
								<input
									type="text"
									placeholder="Your company name"
									value={formData.companyName}
									onChange={(e) =>
										setFormData({ ...formData, companyName: e.target.value })
									}
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									What business are you in?{" "}
									<span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									placeholder="e.g., Technology, Retail, Healthcare"
									value={formData.businessType}
									onChange={(e) =>
										setFormData({ ...formData, businessType: e.target.value })
									}
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Key Products/Services you offer{" "}
									<span className="text-red-500">*</span>
								</label>
								<textarea
									placeholder="e.g., SaaS platform, consulting services, etc."
									value={formData.productsServices}
									onChange={(e) =>
										setFormData({
											...formData,
											productsServices: e.target.value,
										})
									}
									rows="3"
									className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
									required
								/>
							</div>
						</div>

						<button
							onClick={handleFormSubmit}
							disabled={loading}
							className="w-full mt-6 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<span className="inline-block animate-spin">⏳</span>
									Processing...
								</>
							) : (
								<>Continue to Assessment →</>
							)}
						</button>

						<p className="text-xs text-gray-500 text-center mt-6">
							By continuing, you agree to our assessment program
						</p>
					</div>
				</div>
			)}

			{step === "questions" && (
				<div className="max-w-2xl mx-auto">
					<div className="bg-white rounded-xl shadow-lg p-8">
						{/* Header */}
						<div className="mb-8">
							<div className="flex justify-between items-center mb-4">
								<div>
									<h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
										Question {currentQuestionIndex + 1} of {allQuestions.length}
									</h3>
									<p className="text-xs text-gray-500 mt-1">
										{Math.round(
											((currentQuestionIndex + 1) / allQuestions.length) * 100,
										)}
										% Complete
									</p>
								</div>
								<span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
									{currentQuestion?.pillar}
								</span>
							</div>
							{/* Progress Bar */}
							<div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-linear-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
									style={{
										width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`,
									}}
								></div>
							</div>
						</div>

						{/* Question */}
						<h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
							{currentQuestion?.label}
						</h2>

						{/* Answer Options */}
						<div className="space-y-3 mb-8">
							{(() => {
								const q = currentQuestion;
								const existing = answers[currentQuestionIndex];

								// Helper: Score from numeric bucket
								const scoreFromNumeric = (num) => {
									const rules = q.scoringLogic || [];
									for (const r of rules) {
										const [min, max] = r.range;
										if (num >= min && num <= max) return r.value;
									}
									return 0;
								};

								// 1) Single Choice
								if (q?.type === "single_choice") {
									return q?.options?.map((option, idx) => (
										<button
											key={idx}
											onClick={() =>
												handleAnswerSelect(option.value, option.label)
											}
											className={`w-full p-4 text-left border-2 rounded-lg transition ${
												existing?.answerId === option.value
													? "border-blue-600 bg-blue-50"
													: "border-gray-200 hover:border-gray-300"
											}`}
										>
											<span className="font-medium text-gray-800">
												{option.label}
											</span>
										</button>
									));
								}

								// 2) Scale (1-5)
								if (q?.type === "scale") {
									const min = q.scale?.min ?? 1;
									const max = q.scale?.max ?? 5;
									const values = Array.from(
										{ length: max - min + 1 },
										(_, i) => min + i,
									);

									return (
										<div className="space-y-2">
											<div className="flex justify-between text-xs opacity-70 mb-2">
												<span>{q.scale?.labels?.[min] ?? "Low"}</span>
												<span>{q.scale?.labels?.[max] ?? "High"}</span>
											</div>
											{values.map((v) => (
												<button
													key={v}
													onClick={() => handleAnswerSelect(v, String(v))}
													className={`w-full p-4 text-left border-2 rounded-lg transition ${
														existing?.answerId === v
															? "border-blue-600 bg-blue-50"
															: "border-gray-200 hover:border-gray-300"
													}`}
												>
													<span className="font-medium text-gray-800">{v}</span>
												</button>
											))}
										</div>
									);
								}

								// 3) Numeric Bucket
								if (q?.type === "numeric_bucket") {
									return (
										<div>
											<input
												type="number"
												placeholder="Enter a number"
												defaultValue={existing?.answerId ?? ""}
												onChange={(e) => {
													const raw = e.target.value;
													const num = Number(raw);
													if (!raw) {
														handleAnswerSelect(0, "—");
													} else {
														const score = scoreFromNumeric(num);
														handleAnswerSelect(num, String(num));
													}
												}}
												className="w-full border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500"
											/>
											<div className="text-xs text-gray-500 mt-2">
												Your input will be scored automatically based on defined
												ranges.
											</div>
										</div>
									);
								}

								return (
									<div className="text-sm text-gray-500">
										Unsupported question type.
									</div>
								);
							})()}
						</div>

						<div className="mt-8 space-y-4">
							{!answers[currentQuestionIndex] && (
								<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
									<span className="text-amber-600 text-lg">⚠️</span>
									<span className="text-amber-700 font-medium">
										Please select an answer to continue
									</span>
								</div>
							)}

							{currentQuestionIndex === allQuestions.length - 1 &&
								answers.filter((a) => a).length !== allQuestions.length && (
									<div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
										<span className="text-red-600 text-lg">❌</span>
										<span className="text-red-700 font-medium">
											Please answer all {allQuestions.length} questions before
											submitting ({answers.filter((a) => a).length} /{" "}
											{allQuestions.length})
										</span>
									</div>
								)}

							<div className="flex gap-3">
								<button
									onClick={handlePreviousQuestion}
									disabled={currentQuestionIndex === 0 || loading}
									className="flex-1 border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
								>
									← Previous
								</button>

								<button
									onClick={handleNextQuestion}
									disabled={
										!answers[currentQuestionIndex] ||
										loading ||
										(currentQuestionIndex === allQuestions.length - 1 &&
											answers.filter((a) => a).length !== allQuestions.length)
									}
									className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
								>
									{loading ? (
										<>
											<span className="inline-block animate-spin">⏳</span>
											Processing...
										</>
									) : currentQuestionIndex === allQuestions.length - 1 ? (
										<>Submit & Verify →</>
									) : (
										<>Next →</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Register;
