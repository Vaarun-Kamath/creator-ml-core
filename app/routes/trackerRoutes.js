const express = require("express");
const {
	addTrackedVideo,
	getRankHistory,
} = require("../controllers/trackerController");

const router = express.Router();

// POST /api/tracker/track - Add a new video to track
router.post("/track", addTrackedVideo);

// GET /api/tracker/history/:trackedVideoId - Get rank history for a tracked video
router.get("/history/:trackedVideoId", getRankHistory);

module.exports = router;
