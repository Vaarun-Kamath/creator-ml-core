const axios = require("axios");
const { youtubeApiKey } = require("../config/credentials");

/**
 * YouTube Audit Service - Handles video and channel auditing
 */

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube video URL
 * @returns {string|null} videoId - Extracted video ID or null
 */
const extractVideoId = (url) => {
	const regex =
		/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
	const match = url.match(regex);
	return match ? match[1] : null;
};

/**
 * Extract channel ID from YouTube URL
 * @param {string} url - YouTube channel URL
 * @returns {string|null} channelHandle - Extracted channel ID or null
 */
const extractChannelHandle = (url) => {
	const regex = /(?:youtube\.com\/(?:channel\/|c\/|user\/|@)([^\/\s]+))/;
	const match = url.match(regex);
	return match ? match[1] : null;
};

/**
 * Fetch video details from YouTube Data API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video data
 */
const getVideoDetails = async (videoId) => {
	try {
		const url = "https://www.googleapis.com/youtube/v3/videos";
		const params = {
			part: "snippet,statistics,contentDetails,status",
			id: videoId,
			key: youtubeApiKey.key,
		};

		const response = await axios.get(url, { params });
		return response.data.items[0] || null;
	} catch (error) {
		console.error("Error fetching video details:", error);
		throw error;
	}
};

/**
 * Fetch channel details from YouTube Data API
 * @param {string} channelHandle - YouTube channel ID
 * @returns {Promise<Object>} Channel data
 */
const getChannelDetails = async (channelHandle) => {
	try {
		const url = "https://www.googleapis.com/youtube/v3/channels";
		const params = {
			part: "snippet,statistics,brandingSettings",
			forHandle: channelHandle,
			key: youtubeApiKey.key,
		};

		const response = await axios.get(url, { params });
		return response.data.items[0] || null;
	} catch (error) {
		console.error("Error fetching channel details:", error);
		throw error;
	}
};

/**
 * Audit video best practices
 * @param {Object} videoData - Video data from YouTube API
 * @returns {Object} Audit results
 */
const auditVideo = (videoData) => {
	const audit = {
		score: 0,
		maxScore: 100,
		checks: [],
		recommendations: [],
	};

	// Title length check
	const titleLength = videoData.snippet.title.length;
	if (titleLength >= 60 && titleLength <= 70) {
		audit.score += 15;
		audit.checks.push({ name: "Title Length", status: "passed", points: 15 });
	} else {
		audit.checks.push({ name: "Title Length", status: "failed", points: 0 });
		audit.recommendations.push(
			"Optimize title length to 60-70 characters for better visibility"
		);
	}

	// Description length check
	const descriptionLength = videoData.snippet.description.length;
	if (descriptionLength >= 250) {
		audit.score += 15;
		audit.checks.push({
			name: "Description Length",
			status: "passed",
			points: 15,
		});
	} else {
		audit.checks.push({
			name: "Description Length",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push(
			"Add a detailed description (250+ characters) to improve SEO"
		);
	}

	// Tags check
	const tags = videoData.snippet.tags || [];
	if (tags.length >= 5 && tags.length <= 15) {
		audit.score += 10;
		audit.checks.push({ name: "Tags Count", status: "passed", points: 10 });
	} else {
		audit.checks.push({ name: "Tags Count", status: "failed", points: 0 });
		audit.recommendations.push(
			"Use 5-15 relevant tags to help with discoverability"
		);
	}

	// Thumbnail check
	if (
		videoData.snippet.thumbnails.maxres ||
		videoData.snippet.thumbnails.high
	) {
		audit.score += 10;
		audit.checks.push({
			name: "High Quality Thumbnail",
			status: "passed",
			points: 10,
		});
	} else {
		audit.checks.push({
			name: "High Quality Thumbnail",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push("Upload a custom high-resolution thumbnail");
	}

	// Engagement metrics
	const views = parseInt(videoData.statistics.viewCount) || 0;
	const likes = parseInt(videoData.statistics.likeCount) || 0;
	const comments = parseInt(videoData.statistics.commentCount) || 0;

	const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

	if (engagementRate >= 2) {
		audit.score += 20;
		audit.checks.push({
			name: "Engagement Rate",
			status: "passed",
			points: 20,
		});
	} else {
		audit.checks.push({ name: "Engagement Rate", status: "failed", points: 0 });
		audit.recommendations.push(
			"Encourage viewers to like and comment to improve engagement"
		);
	}

	// Video duration check
	const duration = videoData.contentDetails.duration;
	const durationMatch = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
	let totalSeconds = 0;
	if (durationMatch) {
		const hours = parseInt(durationMatch[1]) || 0;
		const minutes = parseInt(durationMatch[2]) || 0;
		const seconds = parseInt(durationMatch[3]) || 0;
		totalSeconds = hours * 3600 + minutes * 60 + seconds;
	}

	if (totalSeconds >= 300 && totalSeconds <= 1200) {
		// 5-20 minutes
		audit.score += 15;
		audit.checks.push({ name: "Video Duration", status: "passed", points: 15 });
	} else {
		audit.checks.push({ name: "Video Duration", status: "failed", points: 0 });
		audit.recommendations.push(
			"Optimize video length to 5-20 minutes for better retention"
		);
	}

	// Privacy status check
	if (videoData.status.privacyStatus === "public") {
		audit.score += 15;
		audit.checks.push({
			name: "Public Visibility",
			status: "passed",
			points: 15,
		});
	} else {
		audit.checks.push({
			name: "Public Visibility",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push("Make video public for maximum reach");
	}

	return audit;
};

/**
 * Audit channel best practices
 * @param {Object} channelData - Channel data from YouTube API
 * @returns {Object} Audit results
 */
const auditChannel = (channelData) => {
	const audit = {
		score: 0,
		maxScore: 100,
		checks: [],
		recommendations: [],
	};

	// Channel description check
	const description = channelData.snippet.description || "";
	if (description.length >= 200) {
		audit.score += 20;
		audit.checks.push({
			name: "Channel Description",
			status: "passed",
			points: 20,
		});
	} else {
		audit.checks.push({
			name: "Channel Description",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push(
			"Add a detailed channel description (200+ characters)"
		);
	}

	// Channel art check
	if (channelData.brandingSettings?.image?.bannerExternalUrl) {
		audit.score += 15;
		audit.checks.push({ name: "Channel Art", status: "passed", points: 15 });
	} else {
		audit.checks.push({ name: "Channel Art", status: "failed", points: 0 });
		audit.recommendations.push("Add channel art/banner to improve branding");
	}

	// Subscriber count check
	const subscriberCount = parseInt(channelData.statistics.subscriberCount) || 0;
	if (subscriberCount >= 1000) {
		audit.score += 25;
		audit.checks.push({
			name: "Subscriber Milestone",
			status: "passed",
			points: 25,
		});
	} else {
		audit.checks.push({
			name: "Subscriber Milestone",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push(
			"Focus on reaching 1,000 subscribers for monetization eligibility"
		);
	}

	// Video count check
	const videoCount = parseInt(channelData.statistics.videoCount) || 0;
	if (videoCount >= 20) {
		audit.score += 20;
		audit.checks.push({ name: "Content Volume", status: "passed", points: 20 });
	} else {
		audit.checks.push({ name: "Content Volume", status: "failed", points: 0 });
		audit.recommendations.push(
			"Publish more content (aim for 20+ videos) to build authority"
		);
	}

	// Channel keywords check
	const keywords = channelData.brandingSettings?.channel?.keywords || "";
	if (keywords.length > 0) {
		audit.score += 20;
		audit.checks.push({
			name: "Channel Keywords",
			status: "passed",
			points: 20,
		});
	} else {
		audit.checks.push({
			name: "Channel Keywords",
			status: "failed",
			points: 0,
		});
		audit.recommendations.push(
			"Add channel keywords in settings to improve discoverability"
		);
	}

	return audit;
};

/**
 * Perform complete audit on YouTube URL
 * @param {string} url - YouTube video or channel URL
 * @returns {Promise<Object>} Complete audit report
 */
const performAudit = async (url) => {
	try {
		console.log(`🔍 Starting audit for: ${url}`);

		const videoId = extractVideoId(url);
		const channelHandle = extractChannelHandle(url);

		let auditResult = {
			url: url,
			type: null,
			data: null,
			audit: null,
			timestamp: new Date().toISOString(),
		};

		if (videoId) {
			// Video audit
			console.log(`📹 Auditing video: ${videoId}`);
			auditResult.type = "video";
			auditResult.data = await getVideoDetails(videoId);

			if (!auditResult.data) {
				throw new Error("Video not found or not accessible");
			}

			auditResult.audit = auditVideo(auditResult.data);
		} else if (channelHandle) {
			// Channel audit
			console.log(`📺 Auditing channel: ${channelHandle}`);
			auditResult.type = "channel";
			auditResult.data = await getChannelDetails(channelHandle);

			if (!auditResult.data) {
				throw new Error("Channel not found or not accessible");
			}

			auditResult.audit = auditChannel(auditResult.data);
		} else {
			throw new Error(
				"Invalid YouTube URL - could not extract video or channel ID"
			);
		}

		console.log(
			`✅ Audit completed with score: ${auditResult.audit.score}/${auditResult.audit.maxScore}`
		);
		return auditResult;
	} catch (error) {
		console.error("Error performing audit:", error);
		throw error;
	}
};

module.exports = {
	performAudit,
	extractVideoId,
	extractChannelHandle,
};
