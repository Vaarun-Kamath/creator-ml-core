const youtubeService = require("../services/youtubeService");
const { parseVideoId, isValidVideoId } = require("../utils/parser");

/**
 * Extract tags from a competitor's YouTube video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVideoTags = async (req, res) => {
	try {
		// Get video URL from query parameters
		const { videoUrl } = req.query;

		// Validate video URL parameter
		if (!videoUrl) {
			return res.status(400).json({
				status: "error",
				message:
					"Video URL is required. Please provide a videoUrl query parameter.",
			});
		}

		// Parse video ID from URL
		const videoId = parseVideoId(videoUrl);

		if (!videoId || !isValidVideoId(videoId)) {
			return res.status(400).json({
				status: "error",
				message:
					"Invalid YouTube video URL. Please provide a valid YouTube video URL.",
				example: "?videoUrl=https://youtube.com/watch?v=dQw4w9WgXcQ",
			});
		}

		console.log(`🏷️ Extracting tags for video ID: ${videoId}`);

		// Fetch video tags from YouTube API
		const tags = await youtubeService.fetchVideoTags(videoId);

		// Return successful response
		res.status(200).json({
			status: "success",
			videoId: videoId,
			videoUrl: videoUrl,
			tags: tags,
			tagCount: tags.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in getVideoTags:", error);

		// Handle specific YouTube API errors
		if (error.response && error.response.status === 404) {
			return res.status(404).json({
				status: "error",
				message:
					"Video not found. The video may be private, deleted, or the ID is incorrect.",
			});
		}

		if (error.response && error.response.status === 403) {
			return res.status(403).json({
				status: "error",
				message: "YouTube API quota exceeded or invalid API key.",
			});
		}

		res.status(500).json({
			status: "error",
			message: "Internal server error while extracting video tags",
		});
	}
};

module.exports = {
	getVideoTags,
};
