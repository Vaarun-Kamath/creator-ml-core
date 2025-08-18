const { GoogleGenAI } = require("@google/genai");

/**
 * Gemini AI Service - Handles communication with Google Gemini API
 */

// Initialize the GoogleGenAI client
// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

/**
 * Generate metadata using Google Gemini AI
 * @param {string} topic - Video topic to generate metadata for
 * @returns {Promise<Object>} Generated metadata object with titles, description, and hashtags
 */
const fetchGeneratedMetadata = async (topic) => {
	try {
		console.log(`🤖 Calling Gemini AI for topic: "${topic}"`);

		// Construct detailed prompt for optimal results
		const prompt = `
You are a professional YouTube SEO expert and content strategist.

TASK:
For a video about the topic '${topic}', generate the following in STRICT JSON only:

{
  "titles": ["title1", "title2", "title3", "title4", "title5"],
  "description": "200-250 words, strong hook at start, keywords included, ends with CTA",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"]
}

RULES:
- Titles: 5 viral, SEO-optimized, <60 chars, engaging.
- Description: natural language, keyword-rich, ends with CTA.
- Hashtags: 10 trending, searchable on YouTube.
- ONLY return valid JSON. Do not include extra text.
`;

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
		});

		// Safer way to extract text
		const generatedText =
			response.candidates?.[0]?.content?.parts?.[0]?.text || "";

		console.log(`🤖 Raw Gemini response: ${response}`);

		// Parse the JSON response
		let metadata;
		try {
			// Clean the response - remove any markdown formatting or extra text
			const cleanedText = generatedText
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "")
				.trim();
			metadata = JSON.parse(cleanedText);
		} catch (parseError) {
			console.error("Error parsing Gemini JSON response:", parseError);

			// Fallback parsing - extract content manually if JSON parsing fails
			metadata = parseMetadataFallback(generatedText, topic);
		}

		// Validate the structure
		const validatedMetadata = validateMetadataStructure(metadata, topic);

		console.log(
			`✅ Generated metadata for "${topic}": ${validatedMetadata.titles.length} titles, ${validatedMetadata.hashtags.length} hashtags`
		);

		return validatedMetadata;
	} catch (error) {
		console.error("Error calling Gemini AI:", error);

		// If API fails, provide fallback content
		if (error.status && error.status >= 400) {
			console.log("🔄 Gemini AI failed, providing fallback metadata");
			return generateFallbackMetadata(topic);
		}

		throw error;
	}
};

/**
 * Fallback parser for when JSON parsing fails
 * @param {string} text - Raw text from Gemini
 * @param {string} topic - Original topic
 * @returns {Object} Parsed metadata object
 */
const parseMetadataFallback = (text, topic) => {
	const metadata = {
		titles: [],
		description: "",
		hashtags: [],
	};

	try {
		// Try to extract titles (look for title patterns)
		const titleMatches = text.match(/"([^"]*?)"/g);
		if (titleMatches && titleMatches.length >= 5) {
			metadata.titles = titleMatches
				.slice(0, 5)
				.map((title) => title.replace(/"/g, ""));
		}

		// Try to extract hashtags (look for # patterns)
		const hashtagMatches = text.match(/#\w+/g);
		if (hashtagMatches) {
			metadata.hashtags = hashtagMatches.slice(0, 10);
		}

		// Extract description (look for longer text blocks)
		const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 50);
		if (sentences.length > 0) {
			metadata.description = sentences.slice(0, 3).join(". ").trim() + ".";
		}
	} catch (fallbackError) {
		console.error("Fallback parsing failed:", fallbackError);
	}

	return metadata;
};

/**
 * Validate and ensure metadata structure is correct
 * @param {Object} metadata - Parsed metadata
 * @param {string} topic - Original topic
 * @returns {Object} Validated metadata
 */
const validateMetadataStructure = (metadata, topic) => {
	const validated = {
		titles: [],
		description: "",
		hashtags: [],
	};

	// Validate titles
	if (Array.isArray(metadata.titles) && metadata.titles.length > 0) {
		validated.titles = metadata.titles
			.filter((title) => typeof title === "string" && title.trim().length > 0)
			.slice(0, 5);
	}

	// Ensure we have at least 5 titles
	while (validated.titles.length < 5) {
		validated.titles.push(`${topic} - Video ${validated.titles.length + 1}`);
	}

	// Validate description
	if (
		typeof metadata.description === "string" &&
		metadata.description.trim().length > 0
	) {
		validated.description = metadata.description.trim();
	} else {
		// Throw an error if description is invalid
		throw new Error("Invalid description");
	}

	// Validate hashtags
	if (Array.isArray(metadata.hashtags) && metadata.hashtags.length > 0) {
		validated.hashtags = metadata.hashtags
			.filter((tag) => typeof tag === "string" && tag.trim().length > 0)
			.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
			.slice(0, 10);
	}

	// Ensure we have at least 10 hashtags
	const defaultHashtags = [
		"#youtube",
		"#content",
		"#viral",
		"#trending",
		"#subscribe",
	];
	while (validated.hashtags.length < 10) {
		const defaultTag =
			defaultHashtags[validated.hashtags.length % defaultHashtags.length];
		if (!validated.hashtags.includes(defaultTag)) {
			validated.hashtags.push(defaultTag);
		} else {
			validated.hashtags.push(`#tag${validated.hashtags.length + 1}`);
		}
	}

	return validated;
};

/**
 * Generate fallback metadata when AI service is unavailable
 * @param {string} topic - Video topic
 * @returns {Object} Fallback metadata
 */
const generateFallbackMetadata = (topic) => {
	return {
		titles: [
			`${topic} - Everything You Need to Know`,
			`The Ultimate Guide to ${topic}`,
			`${topic} Explained in Simple Terms`,
			`Why ${topic} Matters in 2024`,
			`${topic} - Beginner's Complete Guide`,
		],
		description: `Discover everything you need to know about ${topic}. In this comprehensive video, we'll explore the key aspects and provide valuable insights that will help you understand this topic better. Whether you're a beginner or looking to expand your knowledge, this video has something for everyone. Don't forget to like, subscribe, and hit the notification bell for more amazing content!`,
		hashtags: [
			"#youtube",
			"#content",
			"#education",
			"#tutorial",
			"#guide",
			"#tips",
			"#learn",
			"#viral",
			"#trending",
			"#subscribe",
		],
	};
};

module.exports = {
	fetchGeneratedMetadata,
};
