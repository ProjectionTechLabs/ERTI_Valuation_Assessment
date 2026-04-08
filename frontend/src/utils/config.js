const isLocal =
	window.location.hostname === "localhost" ||
	window.location.hostname === "127.0.0.1";

export const API_BASE_URL = (
	isLocal ? import.meta.env.VITE_LOCAL_URL : import.meta.env.VITE_PROD_URL
)?.replace(/\/$/, "");
