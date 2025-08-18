const { TrackedVideo, RankHistory } = require("../models");
const { parseVideoId } = require("../utils/parser");

// Add a new video to track
const addTrackedVideo = async (req, res) => {
	try {
		const { videoUrl, keyword } = req.body;

		if (!videoUrl || !keyword) {
			return res.status(400).json({
				status: "error",
				message: "videoUrl and keyword are required",
			});
		}

		// Parse keywords - handle both string and comma-separated values
		let keywords = [];
		if (typeof keyword === "string") {
			// Split by comma and clean up whitespace
			keywords = keyword
				.split(",")
				.map((k) => k.trim())
				.filter((k) => k.length > 0);
		} else if (Array.isArray(keyword)) {
			// If already an array, just clean it up
			keywords = keyword.map((k) => k.trim()).filter((k) => k.length > 0);
		}

		if (keywords.length === 0) {
			return res.status(400).json({
				status: "error",
				message: "At least one valid keyword is required",
			});
		}

		const videoId = parseVideoId(videoUrl);

		// Check if this video is already being tracked
		const existingTracker = await TrackedVideo.findOne({ videoId });

		if (existingTracker) {
			// Video exists, check for duplicate keywords
			const duplicateKeywords = keywords.filter((k) =>
				existingTracker.targetKeywords.includes(k)
			);

			if (duplicateKeywords.length > 0) {
				return res.status(409).json({
					status: "error",
					message: `This video is already being tracked for keywords: ${duplicateKeywords.join(
						", "
					)}`,
					duplicateKeywords,
				});
			}

			// Add new keywords to existing tracker
			existingTracker.targetKeywords.push(...keywords);
			const savedVideo = await existingTracker.save();

			return res.status(200).json({
				status: "success",
				message: `Added ${keywords.length} new keyword(s) to existing tracked video`,
				data: savedVideo,
				addedKeywords: keywords,
			});
		}

		// Create new tracked video document
		const trackedVideo = new TrackedVideo({
			videoId,
			channelId: "placeholder", // We'll get this from YouTube API later
			videoTitle: "placeholder", // We'll get this from YouTube API later
			channelTitle: "placeholder", // We'll get this from YouTube API later
			targetKeywords: keywords,
			videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
			createdAt: new Date(),
			isActive: true,
		});

		const savedVideo = await trackedVideo.save();

		res.status(201).json({
			status: "success",
			message: `Video added to tracking successfully with ${keywords.length} keyword(s)`,
			data: savedVideo,
			addedKeywords: keywords,
		});
	} catch (error) {
		console.error("Error adding tracked video:", error);
		res.status(500).json({
			status: "error",
			message: "Failed to add video to tracking",
			error: error.message,
		});
	}
};

// Get rank history for a tracked video
const getRankHistory = async (req, res) => {
	try {
		const { trackedVideoId } = req.params;

		if (!trackedVideoId) {
			return res.status(400).json({
				status: "error",
				message: "trackedVideoId is required",
			});
		}

		// Find the tracked video to ensure it exists
		const trackedVideo = await TrackedVideo.findById(trackedVideoId);
		if (!trackedVideo) {
			return res.status(404).json({
				status: "error",
				message: "Tracked video not found",
			});
		}

		// Get all rank history for this video, sorted by date (newest first)
		const rankHistory = await RankHistory.find({
			videoId: trackedVideo.videoId,
		}).sort({ checkedAt: -1 });

		res.status(200).json({
			status: "success",
			message: "Rank history retrieved successfully",
			data: {
				trackedVideo: {
					id: trackedVideo._id,
					videoId: trackedVideo.videoId,
					videoTitle: trackedVideo.videoTitle,
					targetKeywords: trackedVideo.targetKeywords,
					videoUrl: trackedVideo.videoUrl,
				},
				rankHistory,
			},
		});
	} catch (error) {
		console.error("Error getting rank history:", error);
		res.status(500).json({
			status: "error",
			message: "Failed to retrieve rank history",
			error: error.message,
		});
	}
};

module.exports = {
	addTrackedVideo,
	getRankHistory,
};
