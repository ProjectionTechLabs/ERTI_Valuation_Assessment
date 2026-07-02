import React, { useState } from "react";
import api from "../utils/client";
import { questions as allQuestions } from "../utils/questions";
import { buildReportData } from "../utils/reportData";

const TURNOVER_OPTIONS = [
	"10 crore to 50 crore",
	"51 crore to 100 crore",
	"100 crore to 200 crores",
	"Above 200 crore",
];

const TEAM_SIZE_OPTIONS = [
	"1-10",
	"11-30",
	"31-75",
	"76-150",
	"150+",
];

const getStageFromVRI = (vri) => {
	if (vri <= 40) return "Foundation Stage";
	if (vri <= 60) return "Structured Stage";
	if (vri <= 80) return "Scalable Stage";
	return "Valuation Ready";
};

function Register({
	initialMobile = "",
	initialEmail = "",
	onRegisterSuccess,
	onBackToLogin,
}) {
	const [step, setStep] = useState("form");
	const [sessionId, setSessionId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState([]);

	const [formData, setFormData] = useState({
		fname: "",
		lname: "",
		email: initialEmail,
		contact: initialMobile,
		companyName: "",
		businessType: "",
		productsServices: "",
		approximateTurnover: "",
		teamSize: "",
	});

	const currentQuestion = allQuestions[currentQuestionIndex];

	const handleFormSubmit = async () => {
		if (
			!formData.fname ||
			!formData.lname ||
			!formData.email ||
			!/^[6-9]\d{9}$/.test(formData.contact) ||
			!formData.companyName
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
				contact: formData.contact,
				companyName: formData.companyName,
				businessType: formData.businessType,
				productsServices: formData.productsServices,
				approximateTurnover: formData.approximateTurnover,
				teamSize: formData.teamSize,
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

	const handleAnswerSelect = (answerId, answerLabel) => {
		const newAnswers = [...answers];
		const q = allQuestions[currentQuestionIndex];

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
			score = Number(answerId);
		}

		newAnswers[currentQuestionIndex] = {
			questionId: q.id,
			answerId,
			answerTitle: answerLabel,
			answerScore: score,
		};
		setAnswers(newAnswers);
	};

	const handleSubmitAnswers = async () => {
		if (!sessionId) return;

		const answeredCount = answers.filter(Boolean).length;
		if (answeredCount !== allQuestions.length) {
			alert(
				`Please answer all questions. You have answered ${answeredCount} out of ${allQuestions.length} questions.`,
			);
			return;
		}

		setLoading(true);
		try {
			const validAnswers = answers.filter(
				(answer) => answer && answer.questionId && answer.answerId !== undefined,
			);

			const reportData = buildReportData({
				form: {
					firstName: formData.fname,
					lastName: formData.lname,
					contact: formData.contact,
					email: formData.email,
					companyName: formData.companyName,
					industry: "",
					city: "",
					businessType: formData.businessType,
					teamSize: formData.teamSize,
					approximateTurnover: formData.approximateTurnover,
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

			const res = await api.post("/register/submit-assessment", {
				sessionId,
				answers: validAnswers,
			});

			if (res.data.success) {
				onRegisterSuccess({
					user: res.data.data.user,
					token: res.data.data.token,
					reportData,
				});
			}
		} catch (err) {
			alert(err.response?.data?.message || "Failed to submit answers");
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
					<div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center h-14 w-14 bg-blue-100 rounded-2xl mb-4 text-2xl text-blue-700">
								✦
							</div>
							<h2 className="text-3xl font-bold text-gray-800 mb-2">
								Create Your Account
							</h2>
							<p className="text-gray-600">
								Complete your profile first, then move into the assessment
							</p>
						</div>

						<div className="space-y-4">
							<div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
								<div className="font-semibold text-slate-800 mb-1">
									Registration
								</div>
								<div>Use your company details to create the report.</div>
							</div>
							<input
								type="text"
								placeholder="First Name *"
								value={formData.fname}
								onChange={(e) =>
									setFormData({ ...formData, fname: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<input
								type="text"
								placeholder="Last Name *"
								value={formData.lname}
								onChange={(e) =>
									setFormData({ ...formData, lname: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<input
								type="email"
								placeholder="Email Address *"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<input
								type="tel"
								placeholder="Mobile Number *"
								value={formData.contact}
								onChange={(e) =>
									setFormData({
										...formData,
										contact: e.target.value.replace(/\D/g, "").slice(0, 10),
									})
								}
								maxLength="10"
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<input
								type="text"
								placeholder="Company Name *"
								value={formData.companyName}
								onChange={(e) =>
									setFormData({ ...formData, companyName: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<input
								type="text"
								placeholder="What business are you in? (Optional)"
								value={formData.businessType}
								onChange={(e) =>
									setFormData({ ...formData, businessType: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							/>
							<textarea
								placeholder="Key Products/Services you offer (Optional)"
								value={formData.productsServices}
								onChange={(e) =>
									setFormData({
										...formData,
										productsServices: e.target.value,
									})
								}
								rows="3"
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 resize-none bg-slate-50"
							/>
							<select
								value={formData.approximateTurnover}
								onChange={(e) =>
									setFormData({
										...formData,
										approximateTurnover: e.target.value,
									})
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							>
								<option value="">Approximate Turnover (Optional)</option>
								{TURNOVER_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<select
								value={formData.teamSize}
								onChange={(e) =>
									setFormData({ ...formData, teamSize: e.target.value })
								}
								className="w-full border-2 border-gray-200 p-3.5 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
							>
								<option value="">Team Size (Optional)</option>
								{TEAM_SIZE_OPTIONS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>

						<button
							onClick={handleFormSubmit}
							disabled={loading}
							className="w-full mt-6 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-4 rounded-xl transition font-semibold disabled:opacity-50"
						>
							{loading ? "Processing..." : "Continue to Assessment"}
						</button>

						<p className="text-sm text-gray-500 text-center mt-4">
							Already registered?{" "}
							<button
								type="button"
								onClick={onBackToLogin}
								className="font-semibold text-blue-600 hover:text-blue-700"
							>
								Login here
							</button>
							.
						</p>
					</div>
				</div>
			)}

			{step === "questions" && (
				<div className="max-w-2xl mx-auto">
					<div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
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
							<div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
								<div
									className="bg-linear-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
									style={{
										width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`,
									}}
								></div>
							</div>
						</div>

						<h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
							{currentQuestion?.label}
						</h2>

						<div className="space-y-3 mb-8">
							{(() => {
								const q = currentQuestion;
								const existing = answers[currentQuestionIndex];

								const scoreFromNumeric = (num) => {
									const rules = q.scoringLogic || [];
									for (const r of rules) {
										const [min, max] = r.range;
										if (num >= min && num <= max) return r.value;
									}
									return 0;
								};

								if (q?.type === "single_choice") {
									return q.options.map((option) => (
										<button
											key={option.label}
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
											{values.map((value) => (
												<button
													key={value}
													onClick={() =>
														handleAnswerSelect(value, String(value))
													}
													className={`w-full p-4 text-left border-2 rounded-lg transition ${
														existing?.answerId === value
															? "border-blue-600 bg-blue-50"
															: "border-gray-200 hover:border-gray-300"
													}`}
												>
													<span className="font-medium text-gray-800">
														{value}
													</span>
												</button>
											))}
										</div>
									);
								}

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
														handleAnswerSelect(0, "-");
													} else {
														handleAnswerSelect(num, String(num));
														scoreFromNumeric(num);
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

						<div className="flex gap-3">
							<button
								onClick={handlePreviousQuestion}
								disabled={currentQuestionIndex === 0 || loading}
								className="flex-1 border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50"
							>
								Previous
							</button>

							<button
								onClick={handleNextQuestion}
								disabled={!answers[currentQuestionIndex] || loading}
								className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50"
							>
								{loading
									? "Processing..."
									: currentQuestionIndex === allQuestions.length - 1
										? "Submit"
										: "Next"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Register;
