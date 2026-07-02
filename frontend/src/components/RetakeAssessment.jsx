import React, { useMemo, useState } from "react";
import api from "../utils/client";
import { questions as allQuestions } from "../utils/questions";
import { buildReportData } from "../utils/reportData";

const getStageFromVRI = (vri) => {
	if (vri <= 40) return "Foundation Stage";
	if (vri <= 60) return "Structured Stage";
	if (vri <= 80) return "Scalable Stage";
	return "Valuation Ready";
};

function RetakeAssessment({ user, onRetakeSuccess, onCancel }) {
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [answers, setAnswers] = useState([]);
	const [loading, setLoading] = useState(false);

	const currentQuestion = allQuestions[currentQuestionIndex];
	const progress = Math.round(
		((currentQuestionIndex + 1) / allQuestions.length) * 100,
	);

	const form = useMemo(
		() => ({
			firstName: user?.fname || "",
			lastName: user?.lname || "",
			contact: user?.contact || "",
			email: user?.email || "",
			companyName: user?.companyName || "",
			approximateTurnover: user?.approximateTurnover || "",
			businessType: user?.businessType || "",
			teamSize: user?.teamSize || "",
			productsServices: user?.productsServices || "",
		}),
		[user],
	);

	const handleAnswerSelect = (answerId, answerLabel) => {
		const nextAnswers = [...answers];
		const question = allQuestions[currentQuestionIndex];

		let score = 0;
		if (question.type === "numeric_bucket") {
			const numericValue = Number(answerId);
			for (const rule of question.scoringLogic || []) {
				const [min, max] = rule.range;
				if (numericValue >= min && numericValue <= max) {
					score = rule.value;
					break;
				}
			}
		} else {
			score = Number(answerId);
		}

		nextAnswers[currentQuestionIndex] = {
			questionId: question.id,
			answerId,
			answerTitle: answerLabel,
			answerScore: score,
		};

		setAnswers(nextAnswers);
	};

	const handleSubmit = async () => {
		const validAnswers = answers.filter(
			(answer) => answer && answer.questionId && answer.answerId !== undefined,
		);

		if (validAnswers.length !== allQuestions.length) {
			alert("Please answer all questions before submitting.");
			return;
		}

		const reportData = buildReportData({ form, answers: validAnswers });
		const stage = getStageFromVRI(reportData.VRI);

		setLoading(true);
		try {
			await api.post("/form/submit", {
				form: reportData.form,
				meta: {
					VRI: reportData.VRI,
					stage,
					pillars: reportData.pillarRows,
				},
				answers: reportData.answersArr,
			});

			const res = await api.post("/assessment/submit", {
				answers: validAnswers,
				totalScore: reportData.totalScore,
			});

			onRetakeSuccess({
				reportData,
				attemptsRemaining: res.data.attemptsRemaining,
			});
		} catch (err) {
			alert(err.response?.data?.message || "Failed to submit assessment");
		} finally {
			setLoading(false);
		}
	};

	const handleNextQuestion = () => {
		if (!answers[currentQuestionIndex]) {
			alert("Please answer this question before continuing.");
			return;
		}

		if (currentQuestionIndex < allQuestions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
			return;
		}

		handleSubmit();
	};

	const handlePreviousQuestion = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-cyan-50 to-slate-100 p-4 md:p-8">
			<div className="max-w-2xl mx-auto">
				<div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100">
					<div className="mb-8">
						<div className="flex justify-between items-center mb-4">
							<div>
								<h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
									Retake Assessment
								</h3>
								<p className="text-xs text-gray-500 mt-1">
									Question {currentQuestionIndex + 1} of {allQuestions.length}
								</p>
							</div>
							<span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
								{progress}% Complete
							</span>
						</div>

						<div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
							<div
								className="bg-linear-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500"
								style={{ width: `${progress}%` }}
							></div>
						</div>
					</div>

					<div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
						<div className="text-sm text-slate-500">Company</div>
						<div className="text-lg font-semibold text-slate-900">
							{user?.companyName || "Business Assessment"}
						</div>
					</div>

					<h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
						{currentQuestion?.label}
					</h2>

					<div className="space-y-3 mb-8">
						{(() => {
							const question = currentQuestion;
							const existing = answers[currentQuestionIndex];

							if (question?.type === "single_choice") {
								return question.options.map((option) => (
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

							if (question?.type === "scale") {
								const min = question.scale?.min ?? 1;
								const max = question.scale?.max ?? 5;
								const values = Array.from(
									{ length: max - min + 1 },
									(_, index) => min + index,
								);

								return (
									<div className="space-y-2">
										<div className="flex justify-between text-xs opacity-70 mb-2">
											<span>{question.scale?.labels?.[min] ?? "Low"}</span>
											<span>{question.scale?.labels?.[max] ?? "High"}</span>
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

							if (question?.type === "numeric_bucket") {
								return (
									<div>
										<input
											type="number"
											placeholder="Enter a number"
											value={existing?.answerId ?? ""}
											onChange={(event) => {
												const raw = event.target.value;
												if (!raw) {
													const nextAnswers = [...answers];
													nextAnswers[currentQuestionIndex] = undefined;
													setAnswers(nextAnswers);
													return;
												}

												handleAnswerSelect(Number(raw), String(raw));
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
							onClick={currentQuestionIndex === 0 ? onCancel : handlePreviousQuestion}
							disabled={loading}
							className="flex-1 border-2 border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-100 transition font-semibold disabled:opacity-50"
						>
							{currentQuestionIndex === 0 ? "Back to Result" : "Previous"}
						</button>

						<button
							onClick={handleNextQuestion}
							disabled={!answers[currentQuestionIndex] || loading}
							className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-3 rounded-lg transition font-semibold disabled:opacity-50"
						>
							{loading
								? "Submitting..."
								: currentQuestionIndex === allQuestions.length - 1
									? "Submit Retake"
									: "Next"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RetakeAssessment;
