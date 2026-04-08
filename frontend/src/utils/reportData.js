import { questions } from "./questions";
import { PILLAR_CONTENT } from "./pillarExplanations";

export const PILLARS = [
	{ key: "Swami", label: "Swami (Leadership & Vision)" },
	{ key: "Amatya", label: "Amatya (Management & Team)" },
	{ key: "Janapada", label: "Janapada (Market & Customers)" },
	{ key: "Durga", label: "Durga (Systems & Infrastructure)" },
	{ key: "Kosha", label: "Kosha (Finance & Capital)" },
	{ key: "Danda", label: "Danda (Execution & Governance)" },
	{ key: "Mitra", label: "Mitra (Advisors & Alliances)" },
];

const maxScore = questions.reduce((sum, q) => {
	if (q.type === "single_choice") {
		return sum + Math.max(...q.options.map((option) => Number(option.value)));
	}

	if (q.type === "scale") {
		return sum + (q.scale?.max ?? 5);
	}

	if (q.type === "numeric_bucket") {
		return (
			sum + Math.max(...(q.scoringLogic || []).map((rule) => Number(rule.value)))
		);
	}

	return sum;
}, 0);

export function normalizeAnswers(rawAnswers = []) {
	return rawAnswers
		.map((answer) => {
			const question = questions.find((item) => item.id === answer.questionId);

			if (!question) {
				return null;
			}

			const score = Number(answer.answerScore ?? answer.score ?? 0);
			const answerId = answer.answerId ?? answer.rawValue ?? score;
			const selectedLabel =
				answer.answerTitle ??
				answer.selectedLabel ??
				(question.type === "numeric_bucket"
					? String(answerId ?? "")
					: question.options?.find(
							(option) => String(option.value) === String(answerId),
					  )?.label ?? "");

			return {
				questionId: question.id,
				questionText: question.label,
				selectedLabel,
				score,
				rawValue: question.type === "numeric_bucket" ? answerId : null,
				pillar: question.pillar,
				type: question.type,
			};
		})
		.filter(Boolean);
}

function calculatePillarRows(answersArr) {
	const result = {};

	PILLARS.forEach((pillar) => {
		result[pillar.key] = {
			pillar: pillar.key,
			total: 0,
			percent: 0,
			status: "",
		};
	});

	answersArr.forEach((answer) => {
		if (result[answer.pillar]) {
			result[answer.pillar].total += Number(answer.score || 0);
		}
	});

	Object.values(result).forEach((pillar) => {
		pillar.percent = Math.round((pillar.total / 10) * 100);
		pillar.status =
			pillar.percent >= 50
				? "Value Driver Pillar"
				: "Value Enhancement Opportunity";
	});

	return Object.values(result);
}

function buildSection5Data(answersArr, pillarRows) {
	return Object.entries(PILLAR_CONTENT).map(([pillarKey, pillarConfig]) => {
		const pillarRow = pillarRows.find(
			(item) => item.pillar.toUpperCase() === pillarKey,
		);

		const questionsForPillar = Object.entries(pillarConfig.questions).map(
			([qKey, qConfig]) => {
				const answer = answersArr.find(
					(item) => item.questionId === qKey.toLowerCase(),
				);
				const questionPercent = answer
					? Math.round((Number(answer.score || 0) / 5) * 100)
					: 0;
				const explanationType = questionPercent <= 50 ? "low" : "high";

				return {
					id: qKey,
					questionText: qConfig.text,
					questionPercent,
					explanation: qConfig[explanationType],
				};
			},
		);

		return {
			pillarKey,
			label: pillarConfig.label,
			pillarPercent: pillarRow?.percent ?? 0,
			status: pillarRow?.status ?? "",
			questions: questionsForPillar,
			summary: pillarConfig.summary,
		};
	});
}

export function buildReportData({ form = {}, answers = [] }) {
	const normalizedAnswers = normalizeAnswers(answers);
	const totalScore = normalizedAnswers.reduce(
		(sum, answer) => sum + Number(answer.score || 0),
		0,
	);
	const VRI = Number(((totalScore / maxScore) * 100).toFixed(2));
	const pillarRows = calculatePillarRows(normalizedAnswers);
	const section5Data = buildSection5Data(normalizedAnswers, pillarRows);

	return {
		form,
		answersArr: normalizedAnswers,
		totalScore,
		VRI,
		pillarRows,
		section5Data,
		PILLARS,
	};
}
