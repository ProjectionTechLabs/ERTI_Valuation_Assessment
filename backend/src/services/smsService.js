import axios from "axios";

const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

console.log("MSG91 settings:", {
	authKey: AUTH_KEY ? "Loaded ✅" : "Missing ❌",
	templateId: TEMPLATE_ID || "Missing",
});

const normalizePhone = (phone) => {
	const digits = String(phone || "").replace(/\D/g, "");

	if (digits.length === 10) {
		return `91${digits}`;
	}

	if (digits.length === 12 && digits.startsWith("91")) {
		return digits;
	}

	throw new Error(`Invalid mobile number format: ${phone}`);
};

const buildMsg91Payload = (mobile, otp) => {
	if (TEMPLATE_ID) {
		return {
			template_id: TEMPLATE_ID,
			mobile,
			authkey: AUTH_KEY,
			otp,
		};
	}

	return null;
};

export const sendOtpViaMSG91 = async (toPhone, otp) => {
	const formattedPhone = normalizePhone(toPhone);
	const payload = buildMsg91Payload(formattedPhone, otp);

	if (!payload) {
		throw new Error("MSG91 flow/template ID is missing");
	}

	try {
		const response = await axios.post(
			"https://control.msg91.com/api/v5/otp",
			payload,
			{
				headers: {
					"Content-Type": "application/json",
				},
				timeout: 15000,
			},
		);

		console.log(`✅ OTP submitted to MSG91 for ${formattedPhone}`);
		console.log("MSG91 request mode:", "template_id");
		console.log("MSG91 response:", response.data);

		return {
			success: true,
			phone: formattedPhone,
			requestId: response.data?.request_id || null,
			mode: "template_id",
		};
	} catch (error) {
		const status = error.response?.status;
		const errorData = error.response?.data;

		console.error("❌ MSG91 request failed:", {
			status,
			mode: "template_id",
			phone: formattedPhone,
			payload: {
				...payload,
				authkey: AUTH_KEY ? "Loaded ✅" : "Missing ❌",
			},
			response: errorData || error.message,
		});

		throw new Error(
			errorData?.message ||
				errorData?.type ||
				`MSG91 SMS delivery failed${status ? ` (HTTP ${status})` : ""}`,
		);
	}
};

export const sendOtpConsoleLog = (toPhone, otp) => {
	console.log("=".repeat(60));
	console.log("TEST OTP - Console Mode");
	console.log("=".repeat(60));
	console.log(`Phone: ${toPhone}`);
	console.log(`OTP: ${otp}`);
	console.log("=".repeat(60));

	return {
		success: true,
		messageId: `test-${Date.now()}`,
		phone: toPhone,
		otp,
		isTest: true,
	};
};

export const sendOTP = async (toPhone, otp) => {
	if (!AUTH_KEY || !TEMPLATE_ID) {
		console.warn("⚠️ MSG91 not fully configured. Using console mode.");
		return sendOtpConsoleLog(toPhone, otp);
	}

	return sendOtpViaMSG91(toPhone, otp);
};
