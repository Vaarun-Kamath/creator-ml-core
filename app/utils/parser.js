/**
 * URL Parser Utilities
 * Handles parsing and extracting IDs from various YouTube URL formats
 */

/**
 * Extract video ID from YouTube URL
 * Supports various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 *
 * @param {string} url - YouTube video URL
 * @returns {string|null} videoId - Extracted video ID or null if invalid
 */
const parseVideoId = (url) => {
	if (!url || typeof url !== "string") {
		return null;
	}

	// Remove any trailing whitespace
	url = url.trim();

	// Regular expression to match various YouTube URL formats
	const patterns = [
		// Standard watch URLs: youtube.com/watch?v=VIDEO_ID
		/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,

		// Short URLs: youtu.be/VIDEO_ID
		/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,

		// Embed URLs: youtube.com/embed/VIDEO_ID
		/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,

		// Old format: youtube.com/v/VIDEO_ID
		/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,

		// Mobile URLs: m.youtube.com/watch?v=VIDEO_ID
		/(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
	];

	// Try each pattern
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			// YouTube video IDs are exactly 11 characters
			const videoId = match[1];
			if (videoId.length === 11) {
				return videoId;
			}
		}
	}

	// If no pattern matches, return null
	return null;
};

/**
 * Validate if a string is a valid YouTube video ID
 * @param {string} videoId - Potential video ID
 * @returns {boolean} isValid - True if valid video ID format
 */
const isValidVideoId = (videoId) => {
	if (!videoId || typeof videoId !== "string") {
		return false;
	}

	// YouTube video IDs are 11 characters long and contain only alphanumeric, underscore, and hyphen
	const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
	return videoIdPattern.test(videoId);
};

/**
 * Extract channel ID from YouTube channel URL
 * @param {string} url - YouTube channel URL
 * @returns {string|null} channelId - Extracted channel ID or null if invalid
 */
const parseChannelId = (url) => {
	if (!url || typeof url !== "string") {
		return null;
	}

	url = url.trim();

	// Pattern for channel URLs
	const patterns = [
		// youtube.com/channel/CHANNEL_ID
		/(?:youtube\.com\/channel\/)([a-zA-Z0-9_-]+)/,

		// youtube.com/c/CHANNEL_NAME
		/(?:youtube\.com\/c\/)([a-zA-Z0-9_-]+)/,

		// youtube.com/user/USERNAME
		/(?:youtube\.com\/user\/)([a-zA-Z0-9_-]+)/,

		// youtube.com/@HANDLE
		/(?:youtube\.com\/@)([a-zA-Z0-9_-]+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
};

module.exports = {
	parseVideoId,
	isValidVideoId,
	parseChannelId,
};
