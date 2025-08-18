const { TrackedVideo, RankHistory } = require("../models");
const { findVideoRank } = require("./youtubeService");

/**
 * Rank Checker Service - Handles automated rank checking for tracked videos
 */

/**
 * Run daily rank checks for all tracked videos
 * This function will be called by the scheduled job
 */
const runDailyChecks = async () => {
	try {
		console.log("🚀 Starting daily rank checks...");

		// Get all active tracked videos
		const trackedVideos = await TrackedVideo.find({ isActive: true });

		if (trackedVideos.length === 0) {
			console.log("📝 No tracked videos found. Skipping rank checks.");
			return;
		}

		console.log(`📊 Found ${trackedVideos.length} videos to check ranks for`);

		let totalChecks = 0;
		let successfulChecks = 0;
		let failedChecks = 0;

		// Process each tracked video
		for (const trackedVideo of trackedVideos) {
			console.log(`\n🎯 Checking ranks for video: ${trackedVideo.videoId}`);
			console.log(`📹 Video: ${trackedVideo.videoTitle || "Unknown Title"}`);

			// Check rank for each target keyword
			for (const keyword of trackedVideo.targetKeywords) {
				totalChecks++;

				try {
					console.log(`🔍 Checking keyword: "${keyword}"`);

					// Find the video's current rank for this keyword
					const currentRank = await findVideoRank(
						trackedVideo.videoId,
						keyword
					);

					// Create and save rank history record
					const rankHistory = new RankHistory({
						videoId: trackedVideo.videoId,
						keyword: keyword,
						position: currentRank,
						checkedAt: new Date(),
						searchResults: {
							totalResults: currentRank <= 50 ? 50 : 0, // Simplified for now
							topCompetitors: [], // Could be enhanced later
						},
					});

					await rankHistory.save();

					successfulChecks++;
					console.log(`✅ Rank check completed. Position: ${currentRank}`);

					// Add small delay to avoid hitting API rate limits
					await new Promise((resolve) => setTimeout(resolve, 100));
				} catch (error) {
					failedChecks++;
					console.error(
						`❌ Failed to check rank for keyword "${keyword}":`,
						error.message
					);
				}
			}
		}

		console.log(`\n📈 Daily rank check summary:`);
		console.log(`   Total checks: ${totalChecks}`);
		console.log(`   Successful: ${successfulChecks}`);
		console.log(`   Failed: ${failedChecks}`);
		console.log(`✅ Daily rank checks completed!`);
	} catch (error) {
		console.error("💥 Error during daily rank checks:", error);
		throw error;
	}
};

/**
 * Get rank checking statistics
 * @returns {Promise<Object>} Statistics about tracked videos and recent checks
 */
const getRankCheckStats = async () => {
	try {
		const totalTrackedVideos = await TrackedVideo.countDocuments({
			isActive: true,
		});
		const totalRankRecords = await RankHistory.countDocuments();

		// Get recent rank checks (last 24 hours)
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const recentChecks = await RankHistory.countDocuments({
			checkedAt: { $gte: yesterday },
		});

		return {
			totalTrackedVideos,
			totalRankRecords,
			recentChecks,
			lastCheckTime: await RankHistory.findOne({}, { checkedAt: 1 }).sort({
				checkedAt: -1,
			}),
		};
	} catch (error) {
		console.error("Error getting rank check stats:", error);
		throw error;
	}
};

module.exports = {
	runDailyChecks,
	getRankCheckStats,
};
