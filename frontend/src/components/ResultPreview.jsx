import React, { useEffect, useRef, useState } from "react";
import api from "../utils/client";
import { buildReportData } from "../utils/reportData";
import ReportView from "./ReportView";
import HeaderImg from "../assets/eraised-header.jpeg";
import { openPdfInNewTab } from "../utils/openPdf";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

function ResultPreview({
	user,
	isAuthenticated,
	reportData: initialReportData,
	onRequestAuthentication,
	onRetakeRequest,
}) {
	const [reportData, setReportData] = useState(initialReportData);
	const [loading, setLoading] = useState(isAuthenticated && !initialReportData);
	const [downloadLoading, setDownloadLoading] = useState(false);
	const [attemptSummary, setAttemptSummary] = useState({
		attemptsRemaining: user?.attemptsRemaining ?? 0,
		maxAttempts: user?.maxAttempts ?? 3,
		attemptWindowDays: user?.attemptWindowDays ?? 21,
	});

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

		await new Promise((resolve) => setTimeout(resolve, 400));

		const canvas = await html2canvas(cloned, {
			scale: 2,
			useCORS: true,
			backgroundColor: "#ffffff",
		});

		document.body.removeChild(wrapper);

		return canvas;
	};

	useEffect(() => {
		setReportData(initialReportData);
	}, [initialReportData]);

	useEffect(() => {
		setAttemptSummary({
			attemptsRemaining: user?.attemptsRemaining ?? 0,
			maxAttempts: user?.maxAttempts ?? 3,
			attemptWindowDays: user?.attemptWindowDays ?? 21,
		});
	}, [user]);

	useEffect(() => {
		const fetchResultContext = async () => {
			if (!isAuthenticated || initialReportData || !user?.token) {
				setLoading(false);
				return;
			}

			try {
				const [historyRes, statusRes] = await Promise.all([
					api.get("/assessment/history"),
					api.get("/assessment/status"),
				]);
				const latestAttempt = historyRes.data?.data?.[0];
				const statusData = statusRes.data?.data;

				if (latestAttempt) {
					setReportData(
						buildReportData({
							form: {
								firstName: user?.fname,
								lastName: user?.lname,
								contact: user?.contact,
								email: user?.email,
								companyName: user?.companyName,
								approximateTurnover: user?.approximateTurnover,
								businessType: user?.businessType,
								teamSize: user?.teamSize,
								productsServices: user?.productsServices,
							},
							answers: latestAttempt.answers || [],
						}),
					);
				}

				if (statusData) {
					setAttemptSummary({
						attemptsRemaining: statusData.attemptsRemaining ?? 0,
						maxAttempts: statusData.maxAttempts ?? 3,
						attemptWindowDays: statusData.attemptWindowDays ?? 21,
					});
				}
			} catch (err) {
				console.error("Error fetching results:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchResultContext();
	}, [initialReportData, isAuthenticated, user]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading your results...</p>
				</div>
			</div>
		);
	}

	if (!reportData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 p-6">
				<div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8 text-center">
					<h1 className="text-2xl font-bold text-gray-800 mb-3">No result found</h1>
					<p className="text-gray-600">
						We could not find an assessment report for this user yet.
					</p>
				</div>
			</div>
		);
	}

	const handleDownloadPdf = async () => {
		try {
			setDownloadLoading(true);
			document.body.classList.add("pdf-exporting");

			const pdf = new jsPDF("p", "mm", "a4");
			const margin = 10;
			const usableWidth = 210 - margin * 2;

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

			for (let i = 0; i < pillarRefs.current.length; i += 1) {
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

			if (lastPageRef.current) {
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
			}

			pdf.save(`VER_${reportData.form?.companyName || "Report"}.pdf`);
		} catch (err) {
			console.error("PDF generation failed:", err);
			alert("Unable to generate PDF right now.");
		} finally {
			document.body.classList.remove("pdf-exporting");
			setDownloadLoading(false);
		}
	};

	const handleOpenWorkbook = () => {
		openPdfInNewTab(`${import.meta.env.BASE_URL}ERTI-Workbook.pdf`);
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
			<div className="max-w-5xl mx-auto mb-6">
				<div className="bg-white rounded-xl shadow-lg p-8">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						Your Assessment Result
					</h1>
					<p className="text-gray-600">
						{isAuthenticated
							? "You are viewing the complete valuation report."
							: "Please authenticate to view the full result."}
					</p>
				</div>
			</div>

			<ReportView
				form={reportData.form}
				VRI={reportData.VRI}
				pillarRows={reportData.pillarRows}
				PILLARS={reportData.PILLARS}
				section5Data={reportData.section5Data}
				isAuthenticated={isAuthenticated}
				onRequestAuthentication={onRequestAuthentication}
				reportRef={reportRef}
				headerRef={headerRef}
				scorecardRef={scorecardRef}
				pillarRefs={pillarRefs}
				lastPageRef={lastPageRef}
				handleDownloadPdf={handleDownloadPdf}
				handleOpenWorkbook={handleOpenWorkbook}
				downloadLoading={downloadLoading}
				HeaderImg={HeaderImg}
				attemptsRemaining={attemptSummary.attemptsRemaining}
				maxAttempts={attemptSummary.maxAttempts}
				attemptWindowDays={attemptSummary.attemptWindowDays}
				onRetakeRequest={onRetakeRequest}
			/>
		</div>
	);
}

export default ResultPreview;
