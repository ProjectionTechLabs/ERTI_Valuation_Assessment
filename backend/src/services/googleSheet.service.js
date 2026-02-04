import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import fs from "fs";
import path from "path";

console.log("ENV FILE LOADED SHEET ID =", process.env.GOOGLE_SHEET_ID);
const SHEET_ID = process.env.GOOGLE_SHEET_ID?.trim();

if (!SHEET_ID) {
	throw new Error("GOOGLE_SHEET_ID is missing. Check .env file location.");
}

// Load credentials (local OR prod)
let creds;

const CREDS_PATH = path.resolve("google-creds.json");

if (fs.existsSync(CREDS_PATH)) {
	creds = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8"));
	console.log("✅ Using local google-creds.json");
} else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
	creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
	console.log("✅ Using GOOGLE_SERVICE_ACCOUNT env");
} else {
	throw new Error("❌ Google credentials not found");
}

// Create JWT auth
const auth = new JWT({
	email: creds.client_email,
	key: creds.private_key,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function saveAssessmentToSheet({ form, meta, answers }) {
	const doc = new GoogleSpreadsheet(SHEET_ID, auth);

	await doc.loadInfo();
	const sheet = doc.sheetsByIndex[0];

	const pillarMap = {};
	(meta.pillars || []).forEach((p) => {
		pillarMap[p.pillar] = p.percent;
	});

	await sheet.addRow({
		FirstName: form.firstName,
		LastName: form.lastName,
		Email: form.email,
		Contact: form.contact,
		Company: form.companyName,
		Industry: form.industry,
		City: form.city,
		BusinessType: form.businessType,
		TeamSize: form.teamSize,
		IsFounder: form.isFounder,

		VRI: meta.VRI,
		Stage: meta.stage,

		Swami: pillarMap.Swami ?? "",
		Amatya: pillarMap.Amatya ?? "",
		Janapada: pillarMap.Janapada ?? "",
		Durga: pillarMap.Durga ?? "",
		Kosha: pillarMap.Kosha ?? "",
		Danda: pillarMap.Danda ?? "",
		Mitra: pillarMap.Mitra ?? "",

		AnswersJSON: answers
			.map((a, i) => {
				return (
					`${i + 1}. ${a.questionText}\n` +
					`Answer: ${a.selectedLabel ?? a.rawValue ?? "-"}\n` +
					`Score: ${a.score}\n` +
					`Pillar: ${a.pillar}\n`
				);
			})
			.join("\n"),
		SubmittedAt: new Date().toISOString(),
	});
}
