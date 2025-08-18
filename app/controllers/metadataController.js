const geminiService = require("../services/geminiService");

/**
 * Generate AI-powered metadata for video content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateMetadata = async (req, res) => {
	try {
		// Get topic from request body
		const { topic } = req.body;

		// Validate topic
		if (!topic) {
			return res.status(400).json({
				status: "error",
				message:
					"Topic is required. Please provide a topic in the request body.",
			});
		}

		// Validate topic length
		if (typeof topic !== "string" || topic.trim().length === 0) {
			return res.status(400).json({
				status: "error",
				message: "Topic must be a non-empty string.",
			});
		}

		if (topic.length > 500) {
			return res.status(400).json({
				status: "error",
				message: "Topic is too long. Please keep it under 500 characters.",
			});
		}

		console.log(`🤖 Generating metadata for topic: "${topic}"`);

		// Generate metadata using Gemini AI
		const metadata = await geminiService.fetchGeneratedMetadata(topic.trim());

		// Return successful response
		res.status(200).json({
			status: "success",
			topic: topic.trim(),
			metadata: metadata,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in generateMetadata:", error);

		// Handle specific API errors
		if (error.response && error.response.status === 400) {
			return res.status(400).json({
				status: "error",
				message:
					"Invalid request to AI service. Please check your topic and try again.",
			});
		}

		if (error.response && error.response.status === 401) {
			return res.status(500).json({
				status: "error",
				message: "AI service authentication failed. Please contact support.",
			});
		}

		if (error.response && error.response.status === 429) {
			return res.status(429).json({
				status: "error",
				message: "AI service rate limit exceeded. Please try again later.",
			});
		}

		res.status(500).json({
			status: "error",
			message: "Internal server error while generating metadata",
		});
	}
};

module.exports = {
	generateMetadata,
};
