const youtubeService = require("../services/youtubeService");

/**
 * Get keyword suggestions based on a seed keyword
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getKeywordSuggestions = async (req, res) => {
	try {
		// Get seed keyword from query parameters
		const { seed } = req.query;

		// Validate seed keyword
		if (!seed) {
			return res.status(400).json({
				status: "error",
				message:
					"Seed keyword is required. Please provide a seed query parameter.",
			});
		}

		// Log the seed keyword for debugging
		console.log(`🔍 Processing keyword research for seed: "${seed}"`);

		// Get autocomplete suggestions from YouTube
		const suggestions = await youtubeService.processKeywordResearch(seed);

		// Return the suggestions
		res.status(200).json({
			status: "success",
			seed: seed,
			suggestions: suggestions,
			count: suggestions.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in getKeywordSuggestions:", error);
		res.status(500).json({
			status: "error",
			message: "Internal server error while processing keyword research",
		});
	}
};

module.exports = {
	getKeywordSuggestions,
};
