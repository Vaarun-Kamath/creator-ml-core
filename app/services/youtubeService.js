const axios = require("axios");
const { youtubeApiKey } = require("../config/credentials.js");

/**
 * YouTube Service - Handles all external API calls to YouTube services
 */

/**
 * Get keyword suggestions from YouTube Autocomplete API
 * @param {string} seedKeyword - The seed keyword to get suggestions for
 * @returns {Promise<Array>} Array of suggested keywords
 */
const getAutocompleteSuggestions = async (seedKeyword) => {
	try {
		console.log(`📡 Fetching autocomplete suggestions for: ${seedKeyword}`);

		const encodedKeyword = encodeURIComponent(seedKeyword);
		const url = `http://suggestqueries.google.com/complete/search?client=chrome&ds=yt&q=${encodedKeyword}`;

		const response = await axios.get(url);

		// With axios, the response data is directly accessible
		const data = response.data;

		// The response format is an array where:
		// data[0] = the search query
		// data[1] = array of suggestions
		const suggestions = data[1] || [];

		console.log(
			`✅ Found ${suggestions.length} suggestions for "${seedKeyword}"`
		);

		return suggestions;
	} catch (error) {
		console.error("Error fetching autocomplete suggestions:", error);
		throw error;
	}
};

/**
 * Analyze search results for a keyword using YouTube Data API v3
 * @param {string} keyword - The keyword to analyze
 * @returns {Promise<Object>} Analysis results with competition and demand scores
 */
const analyzeKeywordMetrics = async (keyword) => {
	try {
		console.log(`📊 Analyzing metrics for keyword: ${keyword}`);

		const url = "https://www.googleapis.com/youtube/v3/search";

		const params = {
			part: "snippet",
			q: keyword,
			type: "video",
			key: youtubeApiKey.key,
			regionCode: "US",
			maxResults: 10,
		};

		const response = await axios.get(url, { params });
		const data = response.data;

		const videosData = await getVideosStatistics(data.items);

		const competition = calculateCompetitionScore(
			data.pageInfo.totalResults,
			videosData
		);
		const demand = calculateDemandScore(videosData);

		return {
			keyword,
			competition,
			demand,
		};
	} catch (error) {
		console.error("Error analyzing keyword metrics:", error);
		throw error;
	}
};

const getVideosStatistics = async (videosData) => {
	console.log(`📊 Analyzing statistics`);

	const url = `https://www.googleapis.com/youtube/v3/videos`;

	const params = {
		part: "statistics",
		id: videosData.map((video) => video.id.videoId).join(","),
		key: youtubeApiKey.key,
	};

	const response = await axios.get(url, { params });
	const data = response.data;

	let statistics = [];

	for (var i = 0; i < videosData.length; i++) {
		statistics.push({
			id: videosData[i].id.videoId,
			title: videosData[i].snippet.title,
			channel: videosData[i].snippet.channelTitle,
			description: videosData[i].snippet.description,
			publishedAt: videosData[i].snippet.publishedAt,
			viewCount: data.items[i].statistics.viewCount || 0,
			likeCount: data.items[i].statistics.likeCount || 0,
			commentCount: data.items[i].statistics.commentCount || 0,
		});
	}

	return statistics;
};

/**
 * Calculates a competition score based on the total number of search results
 * and the performance of the top-ranking videos.
 * @param {number} totalResults - The estimated total results from the YouTube search API.
 * @param {Array<Object>} topVideosData - The statistics for the top 10 videos.
 * @returns {number} A competition score from 0 to 100.
 */
const calculateCompetitionScore = (totalResults, topVideosData) => {
	// Primary factor: Total number of competing videos (logarithmic scale)
	// Math.log10(1) = 0, Math.log10(1,000,000) = 6. We'll use 7 as a practical max.
	const searchVolumeScore = (Math.log10(totalResults || 1) / 7) * 60; // Max 60 points

	// Secondary factor: How strong are the top players?
	const averageViewCount =
		topVideosData.reduce((sum, video) => sum + parseInt(video.viewCount), 0) /
		topVideosData.length;

	// Log scale for average views of top performers. Math.log10(10,000,000) is ~7
	const topPlayerStrengthScore = (Math.log10(averageViewCount || 1) / 7) * 40; // Max 40 points

	const finalScore = Math.min(searchVolumeScore + topPlayerStrengthScore, 100);
	return Math.round(finalScore);
};

/**
 * Calculates a demand score based on the view velocity and engagement
 * of the top-ranking videos using a logarithmic scale for better differentiation.
 * @param {Array<Object>} videosData - The statistics for the top 10 videos.
 * @returns {number} A demand score from 0 to 100.
 */
const calculateDemandScore = (videosData) => {
	let totalDailyViews = 0;
	let totalLikes = 0;
	let totalComments = 0;

	videosData.forEach((video) => {
		const age = Math.max(
			Math.floor(
				(Date.now() - new Date(video.publishedAt)) / (1000 * 60 * 60 * 24)
			),
			1 // Ensure age is at least 1 to avoid division by zero
		);
		totalDailyViews += parseInt(video.viewCount) / age;
		totalLikes += parseInt(video.likeCount);
		totalComments += parseInt(video.commentCount);
	});

	const avgDailyViews = totalDailyViews / videosData.length;
	const avgLikes = totalLikes / videosData.length;
	const avgComments = totalComments / videosData.length;

	// Logarithmic scaling to handle wide ranges of numbers
	// We set a "benchmark" for what a "100" score would look like.
	// e.g., 50,000 daily views, 10,000 likes, 500 comments.
	const benchmark = {
		views: 50000,
		likes: 10000,
		comments: 500,
	};

	const viewScore =
		(Math.log10(avgDailyViews + 1) / Math.log10(benchmark.views + 1)) * 70; // Weighted 70%
	const likeScore =
		(Math.log10(avgLikes + 1) / Math.log10(benchmark.likes + 1)) * 20; // Weighted 20%
	const commentScore =
		(Math.log10(avgComments + 1) / Math.log10(benchmark.comments + 1)) * 10; // Weighted 10%

	const finalScore = Math.min(viewScore + likeScore + commentScore, 100);
	return Math.round(finalScore);
};

/**
 * Process complete keyword research workflow
 * @param {string} seedKeyword - The seed keyword to research
 * @returns {Promise<Array>} Enriched list of keywords with scores
 */
const processKeywordResearch = async (seedKeyword) => {
	try {
		console.log(`🚀 Starting keyword research workflow for: ${seedKeyword}`);

		// Step 1: Get autocomplete suggestions
		const suggestions = await getAutocompleteSuggestions(seedKeyword);

		// Step 2: Analyze each suggestion
		const enrichedKeywords = await Promise.all(
			suggestions.map((keyword) => analyzeKeywordMetrics(keyword))
		);

		return enrichedKeywords;
	} catch (error) {
		console.error("Error in keyword research workflow:", error);
		throw error;
	}
};

/**
 * Fetch tags from a YouTube video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Array>} Array of tags or empty array if no tags
 */
const fetchVideoTags = async (videoId) => {
	try {
		console.log(`🏷️ Fetching tags for video ID: ${videoId}`);

		const url = "https://www.googleapis.com/youtube/v3/videos";
		const params = {
			part: "snippet",
			id: videoId,
			key: youtubeApiKey.key,
		};

		const response = await axios.get(url, { params });
		const data = response.data;

		// Check if video exists
		if (!data.items || data.items.length === 0) {
			throw new Error("Video not found");
		}

		// Safely extract tags
		const videoData = data.items[0];
		const tags = videoData.snippet.tags || [];

		console.log(`✅ Found ${tags.length} tags for video ${videoId}`);

		return tags;
	} catch (error) {
		console.error("Error fetching video tags:", error);
		throw error;
	}
};

/**
 * Fetch keywords from a YouTube channel's branding settings
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<Array>} Array of keywords or empty array if no keywords
 */
const fetchChannelKeywords = async (channelHandle) => {
	try {
		console.log(`🔑 Fetching keywords for channel ID: ${channelHandle}`);

		const url = "https://www.googleapis.com/youtube/v3/channels";
		const params = {
			part: "brandingSettings",
			forHandle: channelHandle,
			key: youtubeApiKey.key,
		};

		const response = await axios.get(url, { params });
		const data = response.data;

		// Check if channel exists
		if (!data.items || data.items.length === 0) {
			throw new Error("Channel not found");
		}

		// Safely extract keywords
		const channelData = data.items[0];
		const keywordsString =
			channelData.brandingSettings?.channel?.keywords || "";

		// If no keywords string exists, return empty array
		if (!keywordsString || keywordsString.trim() === "") {
			console.log(`✅ No keywords found for channel ${channelHandle}`);
			return [];
		}

		// Parse keywords string into array
		// YouTube stores keywords as a space-separated string, sometimes with quotes
		// Example: "keyword1 keyword2 \"phrase with spaces\" keyword3"
		const keywords = [];
		let currentKeyword = "";
		let insideQuotes = false;

		for (let i = 0; i < keywordsString.length; i++) {
			const char = keywordsString[i];

			if (char === '"') {
				insideQuotes = !insideQuotes;
			} else if (char === " " && !insideQuotes) {
				if (currentKeyword.trim()) {
					keywords.push(currentKeyword.trim());
					currentKeyword = "";
				}
			} else {
				currentKeyword += char;
			}
		}

		// Add the last keyword if it exists
		if (currentKeyword.trim()) {
			keywords.push(currentKeyword.trim());
		}

		// Remove any empty strings and duplicates
		const cleanedKeywords = [
			...new Set(keywords.filter((keyword) => keyword.length > 0)),
		];

		console.log(
			`✅ Found ${cleanedKeywords.length} keywords for channel ${channelHandle}`
		);

		return cleanedKeywords;
	} catch (error) {
		console.error("Error fetching channel keywords:", error);
		throw error;
	}
};

module.exports = {
	getAutocompleteSuggestions,
	analyzeKeywordMetrics,
	processKeywordResearch,
	fetchVideoTags,
	fetchChannelKeywords,
};
