import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ResultPreview from "./components/ResultPreview";

function App() {
	const [currentFlow, setCurrentFlow] = useState("login");
	const [user, setUser] = useState(null);
	const [registrationContext, setRegistrationContext] = useState(null);
	const [reportData, setReportData] = useState(null);

	const handleRedirectToRegister = ({ mobile, companyName } = {}) => {
		setRegistrationContext({
			mobile: mobile || "",
			companyName: companyName || "",
		});
		setCurrentFlow("register");
	};

	const handleLoginSuccess = (data) => {
		if (data.token) {
			localStorage.setItem("token", data.token);
		}

		setUser(data.user ? { ...data.user, token: data.token } : data);
		setReportData(null);
		setCurrentFlow("result");
	};

	const handleRegisterSuccess = ({ user: nextUser, token, reportData: nextReportData }) => {
		if (token) {
			localStorage.setItem("token", token);
		}

		setUser({ ...nextUser, token });
		setReportData(nextReportData);
		setCurrentFlow("result");
	};

	const handleBackToLogin = () => {
		setCurrentFlow("login");
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
					onLoginSuccess={handleLoginSuccess}
				/>
			)}

			{currentFlow === "register" && (
				<Register
					initialMobile={registrationContext?.mobile}
					initialCompanyName={registrationContext.companyName}
					onRegisterSuccess={handleRegisterSuccess}
					onBackToLogin={handleBackToLogin}
				/>
			)}

			{currentFlow === "result" && (
				<ResultPreview
					user={user}
					isAuthenticated={true}
					reportData={reportData}
					onRequestAuthentication={() => {}}
				/>
			)}
		</div>
	);
}

export default App;
