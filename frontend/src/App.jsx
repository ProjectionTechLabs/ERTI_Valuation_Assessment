import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import OTPVerification from "./components/OTPVerification";
import ResultPreview from "./components/ResultPreview";

function App() {
	const [currentFlow, setCurrentFlow] = useState("login");
	const [user, setUser] = useState(null);
	const [authContext, setAuthContext] = useState(null);
	const [reportData, setReportData] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const handleRedirectToRegister = (mobile) => {
		setAuthContext({ mobile, source: "register" });
		setCurrentFlow("register");
	};

	const handleLoginOTPRequired = (mobile) => {
		setAuthContext({ mobile, source: "login" });
		setCurrentFlow("otp-login");
	};

	const handleRegisterOTPStep = ({ sessionId, mobile, reportData: nextReportData }) => {
		setAuthContext({ sessionId, mobile, source: "register" });
		setReportData(nextReportData);
		setCurrentFlow("otp-register");
	};

	const handleRegisterSkip = () => {
		setUser(null);
		setIsAuthenticated(false);
		setCurrentFlow("result");
	};

	const handleOTPVerified = (data) => {
		const nextUser = data.user
			? { ...data.user, token: data.token }
			: { token: data.token, contact: authContext?.mobile };

		if (data.token) {
			localStorage.setItem("token", data.token);
		}

		setUser(nextUser);
		setIsAuthenticated(true);
		setCurrentFlow("result");
	};

	const handleRequestAuthentication = () => {
		if (authContext?.source === "register" && authContext?.sessionId) {
			setCurrentFlow("otp-register");
			return;
		}

		if (authContext?.mobile) {
			setCurrentFlow("otp-login");
		}
	};

	return (
		<div
			data-theme="light"
			style={{ colorScheme: "light" }}
			className="min-h-screen bg-white"
		>
			{currentFlow === "login" && (
				<Login
					onRedirectToRegister={handleRedirectToRegister}
					onOTPRequired={handleLoginOTPRequired}
				/>
			)}

			{currentFlow === "register" && authContext?.mobile && (
				<Register
					mobile={authContext.mobile}
					onOTPPageSuccess={handleRegisterOTPStep}
				/>
			)}

			{currentFlow === "otp-register" && authContext?.sessionId && (
				<OTPVerification
					sessionId={authContext.sessionId}
					mobile={authContext.mobile}
					source="register"
					onOTPVerified={handleOTPVerified}
					onSkip={handleRegisterSkip}
				/>
			)}

			{currentFlow === "otp-login" && authContext?.mobile && (
				<OTPVerification
					mobile={authContext.mobile}
					source="login"
					onOTPVerified={handleOTPVerified}
				/>
			)}

			{currentFlow === "result" && (
				<ResultPreview
					user={user}
					isAuthenticated={isAuthenticated}
					reportData={reportData}
					onRequestAuthentication={handleRequestAuthentication}
				/>
			)}
		</div>
	);
}

export default App;
