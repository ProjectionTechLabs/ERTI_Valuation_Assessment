import { useEffect, useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import ResultPreview from "./components/ResultPreview";
import RetakeAssessment from "./components/RetakeAssessment";
import api from "./utils/client";

const STORAGE_KEYS = {
	token: "token",
	user: "session_user",
};

function App() {
	const [currentFlow, setCurrentFlow] = useState("login");
	const [user, setUser] = useState(null);
	const [registrationContext, setRegistrationContext] = useState(null);
	const [reportData, setReportData] = useState(null);
	const [bootstrapping, setBootstrapping] = useState(true);

	useEffect(() => {
		const restoreSession = async () => {
			const token = localStorage.getItem(STORAGE_KEYS.token);
			const storedUser = localStorage.getItem(STORAGE_KEYS.user);

			if (!token || !storedUser) {
				setBootstrapping(false);
				return;
			}

			try {
				const parsedUser = JSON.parse(storedUser);
				const statusRes = await api.get("/assessment/status");
				const statusData = statusRes.data?.data || {};

				setUser({
					...parsedUser,
					token,
					attemptsRemaining:
						statusData.attemptsRemaining ?? parsedUser.attemptsRemaining,
					maxAttempts: statusData.maxAttempts ?? parsedUser.maxAttempts,
					attemptWindowDays:
						statusData.attemptWindowDays ?? parsedUser.attemptWindowDays,
				});
				setCurrentFlow("result");
			} catch (error) {
				localStorage.removeItem(STORAGE_KEYS.token);
				localStorage.removeItem(STORAGE_KEYS.user);
			} finally {
				setBootstrapping(false);
			}
		};

		restoreSession();
	}, []);

	const handleRedirectToRegister = ({ mobile, email } = {}) => {
		setRegistrationContext({
			mobile: mobile || "",
			email: email || "",
		});
		setCurrentFlow("register");
	};

	const handleLoginSuccess = (data) => {
		if (data.token) {
			localStorage.setItem(STORAGE_KEYS.token, data.token);
		}

		const nextUser = data.user ? { ...data.user, token: data.token } : data;
		localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
		setUser(nextUser);
		setReportData(null);
		setCurrentFlow("result");
	};

	const handleRegisterSuccess = ({ user: nextUser, token, reportData: nextReportData }) => {
		if (token) {
			localStorage.setItem(STORAGE_KEYS.token, token);
		}

		const sessionUser = { ...nextUser, token };
		localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(sessionUser));
		setUser(sessionUser);
		setReportData(nextReportData);
		setCurrentFlow("result");
	};

	const handleBackToLogin = () => {
		setCurrentFlow("login");
	};

	const handleStartRetake = () => {
		setCurrentFlow("retake");
	};

	const handleRetakeSuccess = ({ reportData: nextReportData, attemptsRemaining }) => {
		setUser((prevUser) => {
			if (!prevUser) {
				return prevUser;
			}

			const nextUser = {
				...prevUser,
				attemptsRemaining,
			};
			localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(nextUser));
			return nextUser;
		});
		setReportData(nextReportData);
		setCurrentFlow("result");
	};

	if (bootstrapping) {
		return (
			<div
				data-theme="light"
				style={{ colorScheme: "light" }}
				className="min-h-screen bg-white flex items-center justify-center"
			>
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Restoring your session...</p>
				</div>
			</div>
		);
	}

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
					initialEmail={registrationContext?.email}
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
					onRetakeRequest={handleStartRetake}
				/>
			)}

			{currentFlow === "retake" && (
				<RetakeAssessment
					user={user}
					onRetakeSuccess={handleRetakeSuccess}
					onCancel={() => setCurrentFlow("result")}
				/>
			)}
		</div>
	);
}

export default App;
