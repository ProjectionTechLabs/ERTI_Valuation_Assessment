import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import formRoutes from "./routes/form.route.js";
import authRoutes from "./routes/auth.route.js";
import registerRoutes from "./routes/register.route.js";
import assessmentRoutes from "./routes/assessment.route.js";
import adminRoutes from "./routes/admin.route.js";

import dbConnection from "./dbConnection/db.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Health Check
app.get("/", (req, res) => {
	res.send("Backend running ✅");
});

// Routes
app.use("/api/form", formRoutes); // registration flow
app.use("/api/auth", authRoutes); // login flow
app.use("/api/register", registerRoutes); // new user registration flow
app.use("/api/assessment", assessmentRoutes); // after login
app.use("/api/admin", adminRoutes);

// Start server safely
const PORT = process.env.PORT;

const startServer = async () => {
	try {
		await dbConnection();

		app.listen(PORT, () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error("❌ DB Connection Failed:", error.message);
		process.exit(1);
	}
};

startServer();
