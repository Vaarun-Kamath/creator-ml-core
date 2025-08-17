const express = require("express");
const dotenv = require("dotenv");
const keywordRoutes = require("./routes/keywordRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/keywords", keywordRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`🚀 CreatorML Keyword Research Service running on port ${PORT}`);
	console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
