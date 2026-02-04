import express from "express";
import cors from "cors";

import formRoutes from "./routes/form.route.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/form", formRoutes);

app.get("/", (req, res) => {
	res.send("Backend running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
