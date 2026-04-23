import api from "./client";

export const checkUser = (companyName) =>
	api.post("/auth/check-user", { companyName });

export const sendLoginOTP = (mobile) =>
	api.post("/auth/send-login-otp", { mobile });

export const verifyLoginOTP = (mobile, otp) =>
	api.post("/auth/verify-login-otp", { mobile, otp });

export const sendRegisterOTP = (sessionId) =>
	api.post("/register/send-otp", { sessionId });

export const verifyRegisterOTP = (sessionId, otp) =>
	api.post("/register/verify-otp", { sessionId, otp });
