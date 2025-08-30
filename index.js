const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./app/config/db");
const keywordRoutes = require("./app/routes/keywordRoutes");
const auditRoutes = require("./app/routes/auditRoutes");
const competitorRoutes = require("./app/routes/competitorRoutes");
const metadataRoutes = require("./app/routes/metadataRoutes");
const trackerRoutes = require("./app/routes/trackerRoutes");
const projectRoutes = require("./app/routes/projectRoutes");

const { gcpCredentials } = require("./app/config/credentials");
const { runDailyChecks } = require("./app/services/rankCheckerService");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/keywords", keywordRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/competitor", competitorRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/projects", projectRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		test: gcpCredentials.client_id,
		status: "OK",
		message: "CreatorML Keyword Research Service is running",
		timestamp: new Date().toISOString(),
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		status: "error",
		message: "Something went wrong!",
	});
});

// 404 handler
app.use("*", (req, res) => {
	res.status(404).json({
		status: "error",
		message: "Route not found",
	});
});

// Scheduled Job Simulation - Daily Rank Checks
// In production, use a proper job scheduler like node-cron or Bull Queue
const DAILY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEV_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes for development/testing

// Use shorter interval in development for testing
const checkInterval =
	process.env.NODE_ENV === "production"
		? DAILY_CHECK_INTERVAL
		: DEV_CHECK_INTERVAL;

console.log(
	`⏰ Scheduling rank checks every ${checkInterval / 1000 / 60} minutes`
);

setInterval(async () => {
	try {
		console.log("\n🕐 Scheduled rank check triggered...");
		await runDailyChecks();
	} catch (error) {
		console.error("💥 Scheduled rank check failed:", error);
	}
}, checkInterval);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`🚀 CreatorML Service running on port ${PORT}`);
	console.log(`📍 Health check: http://localhost:${PORT}/health`);
	console.log(`🎯 Rank Tracker: http://localhost:${PORT}/api/tracker`);
});
