const mongoose = require("mongoose");

// Schema for tracking individual videos and their ranking data
const TrackedVideoSchema = new mongoose.Schema({
	videoId: {
		type: String,
		required: true,
		unique: true,
	},
	channelId: {
		type: String,
		required: true,
	},
	videoTitle: {
		type: String,
		required: true,
	},
	channelTitle: {
		type: String,
		required: true,
	},
	targetKeywords: [
		{
			type: String,
			required: true,
		},
	],
	videoUrl: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	isActive: {
		type: Boolean,
		default: true,
	},
});

// Schema for storing ranking history data
const RankHistorySchema = new mongoose.Schema({
	videoId: {
		type: String,
		required: true,
		ref: "TrackedVideo",
	},
	keyword: {
		type: String,
		required: true,
	},
	position: {
		type: Number,
		required: true, // Position in search results (1-50, or 0 if not found)
	},
	searchVolume: {
		type: Number,
		default: null,
	},
	checkedAt: {
		type: Date,
		default: Date.now,
	},
	searchResults: {
		totalResults: Number,
		topCompetitors: [
			{
				videoId: String,
				channelTitle: String,
				videoTitle: String,
				position: Number,
			},
		],
	},
});

// Create indexes for better query performance
TrackedVideoSchema.index({ channelId: 1 });
TrackedVideoSchema.index({ createdAt: -1 });

RankHistorySchema.index({ videoId: 1, keyword: 1 });
RankHistorySchema.index({ checkedAt: -1 });
RankHistorySchema.index({ videoId: 1, checkedAt: -1 });

const TrackedVideo = mongoose.model("TrackedVideo", TrackedVideoSchema);
const RankHistory = mongoose.model("RankHistory", RankHistorySchema);

module.exports = {
	TrackedVideo,
	RankHistory,
};
