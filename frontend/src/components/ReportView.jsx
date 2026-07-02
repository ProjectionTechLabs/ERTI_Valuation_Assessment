import React from "react";

function ReportView({
	form,
	VRI,
	pillarRows,
	PILLARS,
	section5Data,
	isAuthenticated,
	onRequestAuthentication,
	reportRef,
	headerRef,
	scorecardRef,
	pillarRefs,
	lastPageRef,
	handleDownloadPdf,
	handleOpenWorkbook,
	downloadLoading,
	HeaderImg,
	attemptsRemaining = 0,
	maxAttempts = 3,
	attemptWindowDays = 21,
	onRetakeRequest,
}) {
	const assessmentDate = new Date().toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const getStageMeta = (vri) => {
		if (vri < 50)
			return {
				emoji: "🔴",
				stage: "PRAVEŚHAK STAGE",
				interprete: "Entry Stage",
				modern: "Foundation Stage",
				badgeClass: "badge-error",
				scoreBg: "bg-red-50",
				border: "border-red-200",
				meaning:
					"Foundation stage. The business has potential but lacks structure, governance, and valuation clarity. Focus should be on building basic systems, role clarity, and directional discipline.",
			};

		if (vri < 60)
			return {
				emoji: "🟠",
				stage: "ANVEṢHAK STAGE ",
				interprete: "The Explorer",
				modern: "Discovery Stage",
				badgeClass: "badge-warning",
				scoreBg: "bg-orange-50",
				border: "border-orange-200",
				meaning:
					"The founder senses that something critical is missing for business growth or valuation, but cannot clearly identify the constraints. Strategic diagnostics and advisory insight become important here.",
			};

		if (vri < 80)
			return {
				emoji: "🟢",
				stage: "UDYAMĪ STAGE",
				interprete: "The Enterprise Builder",
				modern: "Growth & Structure Stage",
				badgeClass: "badge-success",
				scoreBg: "bg-green-50",
				border: "border-green-200",
				meaning:
					"The founder is actively building the enterprise with improving structure, governance, and growth initiatives. However, a valuation-first mindset is still evolving.",
			};

		return {
			emoji: "🟢🟢",
			stage: "VIJIGĪṢU STAGE",
			interprete: "Valuation-Ready",
			modern: "Valuation Ready",
			badgeClass: "badge-success",
			scoreBg: "bg-emerald-50",
			border: "border-emerald-200",
			meaning:
				"Strategically strong, governance-ready, and positioned for funding, IPO, or strategic partnerships. Focus shifts to expansion, alliances, and institutionalization.",
		};
	};

	const meta = getStageMeta(VRI);
	pillarRefs.current = [];

	const isLocked = !isAuthenticated;
	const canRetake = isAuthenticated && attemptsRemaining > 0 && typeof onRetakeRequest === "function";
	const visibleSection5Data = isAuthenticated
		? section5Data
		: section5Data.slice(0, 1).map((pillar) => ({
				...pillar,
				questions: pillar.questions.slice(0, 1),
			}));
	return (
		<>
			<div ref={reportRef} className="max-w-5xl mx-auto relative">
				{/* Header */}
				<div ref={headerRef}>
					<div className="w-full mb-6">
						<img
							src={HeaderImg}
							alt="eRaised"
							className="w-full h-auto object-contain"
						/>
					</div>
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 text-center sm:text-left">
						{/* Left Section */}
						<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 items-center sm:items-start">
							<div className="leading-tight min-w-0">
								<h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 sm:truncate">
									VALUATION ENHANCEMENT REPORT (VER)
								</h2>

								<p className="text-sm text-gray-500 mt-1 sm:line-clamp-2">
									Based on the Saptang Framework of Kautilya’s Arthashastra
								</p>
							</div>
						</div>

						{/* Right Section – Date */}
						<div className="flex-shrink-0 text-center sm:text-right">
							<div className="text-[11px] uppercase tracking-wide text-gray-500">
								Assessment Date
							</div>
							<div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
								{assessmentDate}
							</div>
						</div>
					</div>

					<div className="my-6 border-t border-gray-200" />

					{/* Meta cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
							<div className="text-[11px] uppercase tracking-wide text-gray-500">
								Company
							</div>
							<div className="mt-1 text-base font-semibold text-gray-900">
								{form.companyName || "—"}
							</div>
						</div>

						{/* <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                                                <div className="text-[11px] uppercase tracking-wide text-gray-500">
                                                    Industry / Sector
                                                </div>
                                                <div className="mt-1 text-base font-semibold text-gray-900">
                                                    {form.industry || "—"}
                                                </div>
                                            </div> */}
					</div>

					{/* Intro */}
					<div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
						<p className="text-sm leading-relaxed text-gray-700">
							The Valuation Enhancement Report (VER) helps you understand and
							increase the true value of your business. Based on Chanakya’s
							Saptang—the seven pillars of building strong and lasting
							institutions—it converts timeless strategic wisdom into practical
							guidance for modern businesses.
						</p>
					</div>

					{isAuthenticated && (
						<div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
							<div className="text-[11px] uppercase tracking-wide font-bold text-blue-900">
								Assessment Window
							</div>
							<p className="mt-2 text-sm leading-relaxed text-blue-900">
								You have {attemptsRemaining} of {maxAttempts} attempt
								{maxAttempts === 1 ? "" : "s"} remaining in the current{" "}
								{attemptWindowDays}-day cycle.
							</p>
						</div>
					)}

					{/* Score + Stage */}
					<div className="grid mt-5 grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="rounded-2xl border border-gray-200 bg-white p-5">
							<div className="text-[11px] uppercase tracking-wide font-bold text-black">
								Valuation Assessment Overall Score
							</div>
							<div className="mt-3 flex items-end gap-2">
								<div className="text-5xl sm:text-6xl font-normal tracking-tight text-gray-900">
									{VRI}
								</div>
								<div className="text-lg font-semibold text-gray-500 mb-1">
									%
								</div>
							</div>
							<div className="mt-2 text-sm text-gray-600">
								Higher score indicates stronger valuation readiness.
							</div>
						</div>

						<div
							className={`rounded-2xl border ${meta.border} ${meta.scoreBg} p-5`}
						>
							<div className="text-[11px] uppercase tracking-wide font-bold text-black">
								Chanakya Stage
							</div>

							<div className="mt-3 text-2xl font-medium text-gray-900">
								<span
									className="font-serif block mb-2 text-2xl"
									style={{
										fontFamily: '"Times New Roman", Times, serif',
									}}
								>
									{meta.stage}
								</span>
								{meta.interprete}
							</div>
						</div>
					</div>

					{/* Meaning */}
					<div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-6">
						<div className="text-[11px] uppercase tracking-wide font-bold text-black">
							What it means
						</div>
						<p className="mt-2 text-sm leading-relaxed text-gray-700">
							{meta.meaning}
						</p>
					</div>
				</div>
				<section
					ref={scorecardRef}
					className="mt-6 rounded-2xl border border-gray-200 bg-white p-6"
				>
					<div className="flex items-start justify-between gap-4">
						<div>
							<h3 className="text-lg font-extrabold text-gray-900">
								Pillar-wise Scorecard (Chanakya Saptang)
							</h3>
						</div>
					</div>

					<div className="mt-4 overflow-x-auto">
						<table className="table w-full">
							<thead>
								<tr className="text-xs text-gray-500">
									<th className="font-semibold">Pillar</th>
									<th className="font-semibold text-center">Score</th>
									<th className="font-semibold">Status</th>
								</tr>
							</thead>

							<tbody>
								{pillarRows.map((r) => (
									<tr key={r.pillar} className="hover">
										<td className="text-sm font-semibold text-gray-900">
											{PILLARS.find((p) => p.key === r.pillar)?.label}
										</td>

										<td className="text-sm text-center font-semibold text-gray-900">
											{r.percent}%
										</td>

										<td className="text-sm">
											<span
												className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold leading-none whitespace-nowrap
            ${
							r.status === "Value Driver Pillar"
								? "bg-green-100 text-green-800 border-green-300"
								: "bg-yellow-100 text-yellow-900 border-yellow-300"
						}
          `}
											>
												{r.status}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="mt-14">
					<h1 className="text-2xl font-bold mb-10">
						Valuation Enhancement Analysis of Your Company
					</h1>

					{visibleSection5Data.map((pillar, index) => (
						<div
							key={pillar.pillarKey}
							ref={(el) => (pillarRefs.current[index] = el)}
							className="mb-16"
						>
							{/* Pillar Header */}
							<div className="mb-6">
								<h2 className="text-xl font-semibold mb-1">{pillar.label}</h2>

								<div className="flex items-center gap-3 text-sm text-gray-600">
									<span className="px-3 py-1 rounded-full bg-gray-100 font-medium">
										Pillar Score: {pillar.pillarPercent}%
									</span>
									<span>•</span>
									<span className="font-medium">{pillar.status}</span>
								</div>
							</div>

							{/* Questions */}
							<div className="space-y-8">
								{pillar.questions.map((q, index) => (
									<div
										key={q.id}
										className="avoid-break p-5 bg-white rounded-lg border border-gray-200"
									>
										{/* Question Header */}
										<div className="flex items-start gap-4 mb-3">
											<span className="shrink-0 px-3 py-1 text-sm font-semibold rounded bg-primary text-white">
												{q.id}
											</span>

											<h4 className="font-medium text-gray-900">
												{q.questionText}
											</h4>
										</div>

										{/* Insight */}
										<div className="mb-3 text-gray-700">
											<p>{q.explanation.body}</p>
										</div>

										{/* Valuation Perspective */}
										<div className="mb-4 text-gray-700 italic">
											<strong className="not-italic">
												Valuation perspective:
											</strong>{" "}
											{q.explanation.valuation}
										</div>

										{/* Tag */}
										<span className="inline-block text-xs text-white px-3 py-1 rounded-full bg-primary font-medium">
											👉 {q.explanation.tag}
										</span>
									</div>
								))}
							</div>

							{/* Pillar Summary */}
							<div className="mt-8 p-5 bg-gray-50 rounded-lg border-l-4 border-primary">
								<p className="font-medium mb-1">Pillar Summary</p>
								<p className="text-gray-700">{pillar.summary}</p>
							</div>
						</div>
					))}

					{isLocked && (
						<div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
							<h3 className="text-xl font-bold text-gray-900 mb-2">
								Please authenticate to view full result
							</h3>
							<p className="text-sm text-gray-700 mb-5">
								You are currently seeing only a partial Step 3 preview. Verify
								your OTP to unlock the complete valuation enhancement analysis.
							</p>
							<button
								className="btn btn-primary rounded-xl px-6"
								onClick={onRequestAuthentication}
							>
								Authenticate
							</button>
						</div>
					)}
				</section>
				{isAuthenticated && (
					<div ref={lastPageRef}>
						<section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
							<h3 className="text-lg font-extrabold text-gray-900">
								Recommended Next Step:
							</h3>

							<p className="mt-3 text-sm leading-relaxed text-gray-700">
								In order to Strengthen Valuation based on Chanakya’s Strategic
								Roadmap book one on one consultation with our Valuation Mentor
							</p>
						</section>

						<div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
							<div className="flex flex-col sm:flex-row gap-3">
								<button
									className="btn btn-outline btn-primary rounded-xl px-6 no-print"
									onClick={handleDownloadPdf}
								>
									{downloadLoading ? (
										<>
											<span className="loading loading-spinner mr-2"></span>
											Generating...
										</>
									) : (
										"Download PDF"
									)}
								</button>
								<button
									className="btn btn-primary rounded-xl px-6 no-print"
									onClick={handleOpenWorkbook}
								>
									Open Workbook
								</button>
							</div>
							{canRetake && (
								<button
									className="btn rounded-xl px-6 no-print"
									onClick={onRetakeRequest}
								>
									Retake Test
								</button>
							)}
						</div>

						<div className="mt-4 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
							<span className="font-semibold text-gray-900">
								Dr.Yogesh Sangani
							</span>
							<span className="mx-2 text-gray-300">|</span>
							<a
								className="underline"
								href="mailto:yogesh@eraisedtoinfinity.com"
							>
								yogesh@eraisedtoinfinity.com
							</a>
							<span className="mx-2 text-gray-300">|</span>
							<a className="underline" href="tel:+919619415535">
								+91 96194 15535
							</a>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default ReportView;
