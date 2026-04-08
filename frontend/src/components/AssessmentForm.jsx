import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { questions } from "../utils/questions";
import logo from "../assets/einfinity-logo-final.png";
import HeaderImg from "../assets/eraised-header.jpeg";
import { calculateVRIFromAnswers } from "../utils/calculateScore";
import { generateValuationPdfBlob } from "../utils/generatePdfFront";
import { openPdfInNewTab } from "../utils/openPdf";
import { PILLAR_CONTENT } from "../utils/pillarExplanations.js";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { useRef } from "react";
import ReportView from "./ReportView.jsx";

const LS = {
	STEP: "vr_step",
	QIDX: "vr_qidx",
	FORM: "vr_form",
	ANSWERS: "vr_answers",
	COMPLETED: "vr_completed",
};

const defaultForm = {
	firstName: "",
	lastName: "",
	contact: "",
	email: "",
	companyName: "",

	// Hide as of now
	industry: "empty",
	designation: "empty",
	city: "empty",
	businessType: "empty",
	teamSize: "empty",
	isFounder: "empty",
	founderName: "empty",
	founderEmail: "empty",
	founderContact: "empty",
};

export default function AssessmentForm() {
	const reportRef = useRef(null);
	const headerRef = useRef(null);
	const scorecardRef = useRef(null);
	const pillarRefs = useRef([]);
	const lastPageRef = useRef(null);

	const captureSection = async (element) => {
		if (!element) {
			throw new Error("PDF section not found");
		}

		const cloned = element.cloneNode(true);
		cloned.classList.add("pdf-mode");

		const wrapper = document.createElement("div");
		wrapper.style.position = "fixed";
		wrapper.style.left = "-9999px";
		wrapper.style.top = "0px";
		wrapper.style.width = "794px";
		wrapper.style.background = "#ffffff";
		wrapper.style.boxSizing = "border-box";
		wrapper.style.padding = "20px";

		cloned.style.width = "100%";

		wrapper.appendChild(cloned);
		document.body.appendChild(wrapper);

		await new Promise((r) => setTimeout(r, 400));

		const canvas = await html2canvas(cloned, {
			scale: 2,
			useCORS: true,
			backgroundColor: "#ffffff",
		});

		document.body.removeChild(wrapper);

		return canvas;
	};

	const handleDownloadPdf = async () => {
		try {
			setDownloadLoading(true);
			document.body.classList.add("pdf-exporting");

			const pdf = new jsPDF("p", "mm", "a4");
			const pdfWidth = 210;
			const pdfHeight = 297;
			const margin = 10;
			const usableWidth = pdfWidth - margin * 2;

			// -------- PAGE 1 (Header + Summary + Stage)
			const headerCanvas = await captureSection(headerRef.current);
			const headerRatio = usableWidth / headerCanvas.width;
			const headerHeight = headerCanvas.height * headerRatio;

			pdf.addImage(
				headerCanvas.toDataURL("image/jpeg", 0.95),
				"JPEG",
				margin,
				margin,
				usableWidth,
				headerHeight,
			);

			// -------- PAGE 2 (Scorecard Only)
			pdf.addPage();

			const scoreCanvas = await captureSection(scorecardRef.current);
			const scoreRatio = usableWidth / scoreCanvas.width;
			const scoreHeight = scoreCanvas.height * scoreRatio;

			pdf.addImage(
				scoreCanvas.toDataURL("image/jpeg", 0.95),
				"JPEG",
				margin,
				margin,
				usableWidth,
				scoreHeight,
			);

			// -------- PILLAR PAGES (7 pages)
			for (let i = 0; i < pillarRefs.current.length; i++) {
				pdf.addPage();

				const pillarCanvas = await captureSection(pillarRefs.current[i]);
				const pillarRatio = usableWidth / pillarCanvas.width;
				const pillarHeight = pillarCanvas.height * pillarRatio;

				pdf.addImage(
					pillarCanvas.toDataURL("image/jpeg", 0.95),
					"JPEG",
					margin,
					margin,
					usableWidth,
					pillarHeight,
				);
			}

			// -------- LAST PAGE (Next Step + Footer)
			pdf.addPage();

			const lastCanvas = await captureSection(lastPageRef.current);
			const lastRatio = usableWidth / lastCanvas.width;
			const lastHeight = lastCanvas.height * lastRatio;

			pdf.addImage(
				lastCanvas.toDataURL("image/jpeg", 0.95),
				"JPEG",
				margin,
				margin,
				usableWidth,
				lastHeight,
			);

			pdf.save(`VER_${form.companyName || "Report"}.pdf`);
		} catch (err) {
			console.error("PDF ERROR:", err);
			alert("PDF export failed.");
		} finally {
			document.body.classList.remove("pdf-exporting");
			setDownloadLoading(false);
		}
	};
	const [emailLoading, setEmailLoading] = useState(false);
	const [downloadLoading, setDownloadLoading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [step, setStep] = useState(Number(localStorage.getItem(LS.STEP)) || 1);
	const [qIdx, setQIdx] = useState(Number(localStorage.getItem(LS.QIDX)) || 0);
	const [form, setForm] = useState(
		JSON.parse(localStorage.getItem(LS.FORM)) || defaultForm,
	);

	const [pdfUrl, setPdfUrl] = useState(
		localStorage.getItem("vr_pdf_url") || "",
	);
	const [sending, setSending] = useState(false);
	const [answersArr, setAnswersArr] = useState(
		JSON.parse(localStorage.getItem(LS.ANSWERS)) || [],
	); // array of answers objects
	const [completed, setCompleted] = useState(
		Boolean(localStorage.getItem(LS.COMPLETED)),
	);

	useEffect(() => localStorage.setItem(LS.STEP, String(step)), [step]);
	useEffect(() => localStorage.setItem(LS.QIDX, String(qIdx)), [qIdx]);
	useEffect(() => localStorage.setItem(LS.FORM, JSON.stringify(form)), [form]);
	useEffect(
		() => localStorage.setItem(LS.ANSWERS, JSON.stringify(answersArr)),
		[answersArr],
	);
	useEffect(
		() => localStorage.setItem(LS.COMPLETED, JSON.stringify(completed)),
		[completed],
	);

	const totalQuestions = questions.length;

	const totalScore = useMemo(
		() => answersArr.reduce((s, a) => s + Number(a.score || 0), 0),
		[answersArr],
	);

	const maxScore = useMemo(() => {
		return questions.reduce((sum, q) => {
			if (q.type === "single_choice") {
				return sum + Math.max(...q.options.map((o) => Number(o.value)));
			}
			if (q.type === "scale") {
				return sum + (q.scale?.max ?? 5);
			}
			if (q.type === "numeric_bucket") {
				return (
					sum + Math.max(...(q.scoringLogic || []).map((r) => Number(r.value)))
				);
			}
			return sum;
		}, 0);
	}, []);
	const VRI = useMemo(
		() => Number(((totalScore / maxScore) * 100).toFixed(2)),
		[totalScore, maxScore],
	);

	useEffect(() => {
		if (step === 2 && qIdx >= totalQuestions) {
			setStep(3);
		}
	}, [step, qIdx, totalQuestions]);

	const updateForm = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const startAssessment = () => {
		// validate required fields
		const required = [
			"firstName",
			"lastName",
			"email",
			"contact",
			"companyName",
			"designation",
			"city",
			"businessType",
			"teamSize",
			"isFounder",
		];
		if (form.isFounder === "No")
			required.push("founderName", "founderEmail", "founderContact");
		for (let k of required) {
			if (!form[k] || String(form[k]).trim() === "") {
				alert("Please fill all required fields.");
				return;
			}
		}
		setStep(2);
		setQIdx(0);
	};

	const setAnswer = (score, selectedLabel, rawValue = null) => {
		const q = questions[qIdx];

		setAnswersArr((prev) => {
			const copy = [...prev];
			const existingIndex = copy.findIndex((a) => a.questionId === q.id);

			const answerObj = {
				questionId: q.id,
				questionText: q.label,
				selectedLabel: selectedLabel ?? "",
				score: Number(score) || 0,
				rawValue, // useful for numeric_bucket (Q3, Q8)
				pillar: q.pillar,
				type: q.type,
			};

			if (existingIndex >= 0) copy[existingIndex] = answerObj;
			else copy.push(answerObj);

			return copy;
		});
	};

	// const next = () => {
	// 	// ensure current question answered
	// 	const q = questions[qIdx];
	// 	const existing = answersArr.find((a) => a.questionId === q.id);
	// 	if (!existing) {
	// 		alert("Please answer before proceeding.");
	// 		return;
	// 	}
	// 	if (qIdx < totalQuestions - 1) setQIdx(qIdx + 1);
	// 	else {
	// 		setStep(3);
	// 		setCompleted(true);
	// 	}
	// };

	const next = () => {
		const q = questions[qIdx];
		const ans = answersArr.find((a) => a.questionId === q.id);

		// must exist
		if (!ans) {
			alert("Please answer before proceeding.");
			return;
		}

		// numeric_bucket must have rawValue
		if (q.type === "numeric_bucket") {
			const rv = ans?.rawValue;
			if (rv === null || rv === undefined || String(rv).trim() === "") {
				alert("Please enter a number before proceeding.");
				return;
			}
		}

		if (qIdx < totalQuestions - 1) setQIdx(qIdx + 1);
		else {
			setCompleted(true);
			setStep(3);
		}
	};

	const submitAssessmentToBackend = async () => {
		const stage =
			VRI <= 40
				? "Foundation Stage"
				: VRI <= 60
					? "Structured Stage"
					: VRI <= 80
						? "Scalable Stage"
						: "Valuation Ready";

		const apiUrl =
			window.location.hostname === "localhost"
				? import.meta.env.VITE_LOCAL_URL
				: import.meta.env.VITE_PROD_URL;

		const res = await fetch(`${apiUrl}/api/form/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				form,
				meta: {
					VRI,
					stage,
					pillars: pillarRows,
				},
				answers: answersArr, // 🔥 FULL QUESTION DATA
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || "Submission failed");
		}

		return res.json();
	};

	useEffect(() => {
		if (step === 3 && completed) {
			submitAssessmentToBackend()
				.then(() => {
					console.log("✅ Assessment saved to backend");
				})
				.catch((err) => {
					console.error("❌ Backend submit failed:", err);
				});
		}
	}, [step, completed]);

	const submitToBackendAndEmail = async () => {
		if (isLive) {
			alert("Email sending will be enabled once the project is fully live.");
			return;
		}

		try {
			setEmailLoading(true);
			await generateReport({ action: "email" });
			alert("Report emailed successfully!");
		} catch (err) {
			console.error("Submit Error:", err);
			alert(err.message || "Something went wrong while submitting.");
		} finally {
			setEmailLoading(false);
		}
	};

	const resetAssessment = () => {
		// Clear all localStorage related to this assessment
		localStorage.removeItem(LS.STEP);
		localStorage.removeItem(LS.QIDX);
		localStorage.removeItem(LS.FORM);
		localStorage.removeItem(LS.ANSWERS);
		localStorage.removeItem(LS.COMPLETED);
		localStorage.removeItem("valuation_result"); // if you stored result

		// Reset state
		setStep(1);
		setQIdx(0);
		setForm(defaultForm);
		setAnswersArr([]);
		setCompleted(false);
	};

	const back = () => {
		if (step === 2 && qIdx > 0) setQIdx(qIdx - 1);
		else if (step === 2 && qIdx === 0) setStep(1);
		else if (step === 3) {
			setStep(2);
			setQIdx(totalQuestions - 1);
		}
	};

	const isLive = useMemo(() => {
		const host = window.location.hostname || "";
		return host.includes("onrender.com") || host.includes("render.com");
	}, []);

	// ✅ One function to generate PDF (and optionally email)
	const generateReport = async ({ action }) => {
		// action: "email" | "download"
		const stage =
			VRI <= 40
				? "Foundation Stage"
				: VRI <= 60
					? "Structured Stage"
					: VRI <= 80
						? "Scalable Stage"
						: "Valuation Ready";

		// Auto-save locally
		localStorage.setItem(
			"valuation_result",
			JSON.stringify({
				form,
				answersArr,
				totalScore,
				VRI,
				stage,
				time: new Date().toISOString(),
			}),
		);

		const isLocalhost =
			window.location.hostname === "localhost" ||
			window.location.hostname === "127.0.0.1";

		const apiUrl = (
			isLocalhost
				? import.meta.env.VITE_LOCAL_URL
				: import.meta.env.VITE_PROD_URL
		)?.replace(/\/$/, ""); // remove trailing slash

		const backendRes = await fetch(`${apiUrl}/api/form/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				form,
				answers: answersArr,
				action, // ✅ tell backend what to do
				meta: { totalScore, VRI, stage }, // optional but useful
			}),
		});

		const data = await backendRes.json();
		if (!backendRes.ok) throw new Error(data.message || "Backend error");

		// expected: { pdfUrl: "..." }
		if (data.pdfUrl) {
			setPdfUrl(data.pdfUrl);
			localStorage.setItem("vr_pdf_url", data.pdfUrl);
		}

		return data;
	};

	const ROADMAP_TEXT = [
		"The Value Enhancement Roadmap is a simple and practical guide that helps business owners move beyond only focusing on day-to-day profits and start thinking about building long-term business value. Many MSME and family business owners work extremely hard to grow sales, but often do not realise that real wealth is created when the value of the business increases, not just when profits increase.",
		"Traditionally, valuation and wealth creation through valuation were seen as concepts meant only for large corporate houses. But this is not true. MSMEs and family businesses can also create significant wealth through valuation—if they get the right direction at the right stage of their business. The Value Enhancement Roadmap provides that direction in a structured and easy-to-follow manner.",
		"Think of this roadmap as the first step in your wealth creation journey. As the saying goes, “A journey of a thousand miles begins with a single step.” This roadmap helps you understand where your business stands today and what small but important changes can increase the value of your enterprise over time.",
		"More importantly, it encourages founders to start thinking differently—to see their business not just as a source of income, but as a valuable asset. It plants the idea of future possibilities such as bringing investors, strategic partnerships, or even listing the business one day. It helps founders begin the journey of understanding the true value of their equity in the company.",
		"This roadmap is based on an assessment of your business across the seven pillars of Chanakya’s Saptang, which represent the core foundations of a strong and valuable business. The assessment shows which areas of your business are already strong and which areas need improvement to support growth, scalability, and higher valuation. By working on these pillars step by step, MSME and family businesses can gradually build a stronger, more valuable, and wealth-creating enterprise.",
	];

	const PILLARS = [
		{ key: "Swami", label: "Swami (Leadership & Vision)" },
		{ key: "Amatya", label: "Amatya (Management & Team)" },
		{ key: "Janapada", label: "Janapada (Market & Customers)" },
		{ key: "Durga", label: "Durga (Systems & Infrastructure)" },
		{ key: "Kosha", label: "Kosha (Finance & Capital)" },
		{ key: "Danda", label: "Danda (Execution & Governance)" },
		{ key: "Mitra", label: "Mitra (Advisors & Alliances)" },
	];

	const calculatePillarPercentages = (answersArr) => {
		const result = {};

		// init
		PILLARS.forEach((p) => {
			result[p.key] = {
				pillar: p.key,
				total: 0,
				percent: 0,
				status: "",
			};
		});

		// sum answers
		answersArr.forEach((ans) => {
			if (result[ans.pillar]) {
				result[ans.pillar].total += Number(ans.score || 0);
			}
		});

		// calculate % (max = 10)
		Object.values(result).forEach((p) => {
			p.percent = Math.round((p.total / 10) * 100);

			p.status =
				p.percent >= 50
					? "Value Driver Pillar"
					: "Value Enhancement Opportunity";
		});

		return Object.values(result);
	};

	const pillarRows = useMemo(() => {
		return calculatePillarPercentages(answersArr);
	}, [answersArr]);

	const logPillarDebug = (questions, answersArr) => {
		const pillarMap = {};

		// init pillars
		questions.forEach((q) => {
			if (!pillarMap[q.pillar]) {
				pillarMap[q.pillar] = {
					questions: [],
					total: 0,
				};
			}
		});

		// attach answers to questions
		questions.forEach((q) => {
			const ans = answersArr.find((a) => a.questionId === q.id);

			if (pillarMap[q.pillar]) {
				pillarMap[q.pillar].questions.push({
					id: q.id,
					question: q.label,
					answer: ans?.selectedLabel ?? "NOT ANSWERED",
					score: ans?.score ?? 0,
				});

				pillarMap[q.pillar].total += Number(ans?.score || 0);
			}
		});

		// pretty console output
		console.group("🧠 PILLAR DEBUG — QUESTIONS & ANSWERS");

		Object.entries(pillarMap).forEach(([pillar, data]) => {
			console.group(`🔱 ${pillar}`);

			data.questions.forEach((q, i) => {
				console.log(
					`Q${i + 1}: ${q.question}\n→ Answer: ${q.answer}\n→ Score: ${q.score}`,
				);
			});

			const percent = Math.round((data.total / 10) * 100);

			console.log("TOTAL SCORE:", data.total, "/ 10");
			console.log("PERCENT:", percent + "%");
			console.groupEnd();
		});

		console.groupEnd();
	};

	useEffect(() => {
		if (step === 3) {
			logPillarDebug(questions, answersArr);
		}
	}, [step, answersArr]);

	// for the 5th section

	const getExplanationType = (percent) => {
		return percent <= 50 ? "low" : "high";
	};

	const QUESTION_PILLAR_MAP = {
		Q1: "SWAMI",
		Q2: "SWAMI",

		Q3: "AMATYA",
		Q4: "AMATYA",

		Q5: "JANAPADA",
		Q6: "JANAPADA",

		Q7: "DURGA",
		Q8: "DURGA",

		Q9: "KOSHA",
		Q10: "KOSHA",

		Q11: "DANDA",
		Q12: "DANDA",

		Q13: "MITRA",
		Q14: "MITRA",
	};

	const section5Data = useMemo(() => {
		return Object.entries(PILLAR_CONTENT).map(([pillarKey, pillarConfig]) => {
			// 🔹 get pillar % from already-calculated pillarRows
			const pillarRow = pillarRows.find(
				(p) => p.pillar.toUpperCase() === pillarKey,
			);

			const pillarPercent = pillarRow?.percent ?? 0;

			// 🔹 questions inside this pillar
			const questions = Object.entries(pillarConfig.questions).map(
				([qKey, qConfig]) => {
					// convert "Q1" → "q1"
					const normalizedQId = qKey.toLowerCase();

					const answer = answersArr.find((a) => a.questionId === normalizedQId);

					// each question is out of 5
					const questionPercent = answer
						? Math.round((answer.score / 5) * 100)
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
				pillarPercent,
				status: pillarRow?.status ?? "",
				questions,
				summary: pillarConfig.summary,
			};
		});
	}, [answersArr, pillarRows]);

	const NEXT_STEP_TEXT =
		"If you seek to improve your valuation, this section invites you to pause, reflect, and act with intent. Chanakya’s Roadmap to Strengthen Valuation is not a list of generic recommendations; it is a structured path rooted in the Arthashastra that helps you consciously strengthen the foundations of your enterprise before engaging investors. For each Saptang pillar, this section provides deep Chanakya Strategic Guidance explaining how Kautilya defined and viewed the pillar, the philosophical and practical role it played in sustaining a kingdom, and the leadership behaviour and institutional design expected under it. This is followed by Integrated Valuation Insights that translate ancient wisdom into investor-grade language—showing how the strength or weakness of the pillar impacts valuation, what risks arise when it is underdeveloped, and what valuation premiums emerge when it is strong. Reference Sutra(s) with their one-line meanings anchor each insight in original Arthashastra thought, ensuring conceptual integrity. Finally, the Founder Self-Assessment presents five Kautilya-aligned qualities in a reflective format, allowing you to introspect, rate yourself honestly on a 1–5 scale, and identify precise areas for improvement. Taken together, this roadmap transforms valuation from a passive outcome into an active leadership discipline, where strengthening the enterprise precedes seeking capital—and confidence replaces negotiation.";

	return (
		<div
			className={`p-2 sm:p-6 flex justify-center bg-white text-gray-900 ${
				step === 1 ? "min-h-screen items-center" : ""
			}`}
		>
			<div className="w-full max-w-4xl bg-white border border-gray-200 shadow-xl rounded-2xl p-8">
				<div className="flex flex-col justify-between items-start">
					{step !== 3 && (
						<>
							{step === 1 && (
								<img
									src={HeaderImg}
									alt="eRaised"
									className="w-full h-auto mb-6 object-contain"
								/>
							)}
							<h1 className="text-2xl font-bold mb-6">
								Valuation Enhancement Assessment
								<span className="block text-sm  mt-1 font-normal text-gray-500">
									Based on the Saptang Framework of Kautilya’s Arthashastra
								</span>
							</h1>
						</>
					)}
				</div>

				{/* Step 1 */}
				{step === 1 && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<input
								name="firstName"
								placeholder="First Name *"
								value={form.firstName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<input
								name="lastName"
								placeholder="Last Name *"
								value={form.lastName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<input
								name="email"
								type="email"
								placeholder="Email *"
								value={form.email}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="contact"
								placeholder="Contact *"
								value={form.contact}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="companyName"
								placeholder="Company Name *"
								value={form.companyName}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							{/* <select
								name="industry"
								value={form.industry}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							>
								<option value="">Company Industry</option>
								<option value="IT / Software">IT / Software</option>
								<option value="Manufacturing">Manufacturing</option>
								<option value="Retail">Retail</option>
								<option value="Healthcare">Healthcare</option>
								<option value="Finance">Finance</option>
								<option value="Education">Education</option>
								<option value="Logistics">Logistics</option>
								<option value="Real Estate">Real Estate</option>
								<option value="Other">Other</option>
							</select>
							<input
								name="designation"
								placeholder="Designation *"
								value={form.designation}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							/>
							<input
								name="city"
								placeholder="City *"
								value={form.city}
								onChange={updateForm}
								className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							/>
							<select
								name="businessType"
								value={form.businessType}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							>
								<option value="">Business Type *</option>
								<option value="Proprietary">Proprietary</option>
								<option value="Partnership">Partnership</option>
								<option value="LLP">LLP</option>
								<option value="Private Limited">Private Limited</option>
							</select>
							<select
								name="teamSize"
								value={form.teamSize}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
							>
								<option value="">Team Size *</option>
								<option value="1-10">1–10</option>
								<option value="11-30">11–30</option>
								<option value="31-75">31–75</option>
								<option value="76-150">76–150</option>
								<option value="150+">150+</option>
							</select>
							<select
								name="isFounder"
								value={form.isFounder}
								onChange={updateForm}
								className="select select-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
							>
								<option value="">Are you a Founder? *</option>
								<option value="Yes">Yes</option>
								<option value="No">No</option>
							</select> */}
						</div>

						{/* {form.isFounder === "No" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
								<input
									name="founderName"
									placeholder="Founder Name *"
									value={form.founderName}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm md:col-span-2 focus:ring focus:ring-primary/20"
								/>
								<input
									name="founderEmail"
									placeholder="Founder Email *"
									value={form.founderEmail}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
								/>
								<input
									name="founderContact"
									placeholder="Founder Contact *"
									value={form.founderContact}
									onChange={updateForm}
									className="input input-bordered w-full rounded-lg shadow-sm focus:ring focus:ring-primary/20"
								/>
							</div>
						)} */}

						<div className="flex justify-end mt-6">
							<button
								className="btn btn-primary px-6 py-2 rounded-lg shadow"
								onClick={startAssessment}
							>
								Begin Assessment →
							</button>
						</div>
					</div>
				)}

				{/* Step 2: one question per page */}
				{step === 2 && (
					<div>
						<div className="flex justify-between items-center mb-4">
							<div>
								<h3 className="text-[14px] font-medium">
									Question {qIdx + 1} of {totalQuestions}
								</h3>
								<p className="text-lg font-semibold text-gray-700 mt-1">
									{questions[qIdx].label}
								</p>
							</div>
						</div>

						<div className="card p-6 mb-4 border shadow-md bg-base-100 rounded-lg">
							{(() => {
								const q = questions[qIdx];
								const existing = answersArr.find((a) => a.questionId === q.id);

								// helper: for numeric_bucket scoring
								const scoreFromNumeric = (num) => {
									const rules = q.scoringLogic || [];
									for (const r of rules) {
										const [min, max] = r.range;
										if (num >= min && num <= max) return r.value;
									}
									return 0;
								};

								// ✅ 1) single_choice
								if (q.type === "single_choice") {
									return q.options.map((opt) => {
										const checked = existing
											? Number(existing.score) === Number(opt.value)
											: false;

										return (
											<label
												key={opt.label}
												className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-base-200 transition"
											>
												<input
													type="radio"
													className="radio radio-primary"
													checked={checked}
													onChange={() => setAnswer(opt.value, opt.label)}
												/>
												<span className="text-gray-800">{opt.label}</span>
											</label>
										);
									});
								}

								// ✅ 2) scale (1–5)
								if (q.type === "scale") {
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

											{values.map((v) => {
												const checked = existing
													? Number(existing.score) === Number(v)
													: false;
												return (
													<label
														key={v}
														className="flex items-center gap-3 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-base-200 transition"
													>
														<input
															type="radio"
															className="radio radio-primary"
															checked={checked}
															onChange={() => setAnswer(v, String(v))}
														/>
														<span className="text-gray-800">{v}</span>
													</label>
												);
											})}
										</div>
									);
								}

								// ✅ 3) numeric_bucket (Q3, Q8)
								if (q.type === "numeric_bucket") {
									return (
										<div className="space-y-3">
											<input
												type="number"
												className="input input-bordered w-full"
												placeholder="Enter a number"
												defaultValue={existing?.rawValue ?? ""}
												onChange={(e) => {
													const raw = e.target.value;
													const num = Number(raw);
													if (!raw) return setAnswer(0, "—", raw);
													const score = scoreFromNumeric(num);
													setAnswer(score, String(num), raw);
												}}
											/>

											<div className="text-xs opacity-70">
												Your input will be scored automatically based on defined
												ranges.
											</div>
										</div>
									);
								}

								return (
									<div className="text-sm opacity-70">
										Unsupported question type.
									</div>
								);
							})()}
						</div>

						<div className="flex justify-between">
							<button className="btn btn-outline" onClick={back}>
								Back
							</button>
							<button className="btn btn-primary" onClick={next}>
								Next →
							</button>
						</div>
					</div>
				)}

				{/* Step 3: report */}

				{step === 3 && (
					<ReportView
						form={form}
						VRI={VRI}
						pillarRows={pillarRows}
						PILLARS={PILLARS}
						section5Data={section5Data}
						isAuthenticated={true}
						onRequestAuthentication={null}
						reportRef={reportRef}
						headerRef={headerRef}
						scorecardRef={scorecardRef}
						pillarRefs={pillarRefs}
						lastPageRef={lastPageRef}
						handleDownloadPdf={handleDownloadPdf}
						downloadLoading={downloadLoading}
						HeaderImg={HeaderImg}
					/>
				)}
			</div>
		</div>
	);
}
