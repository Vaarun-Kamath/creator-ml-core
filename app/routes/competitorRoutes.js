const express = require("express");
const router = express.Router();
const competitorController = require("../controllers/competitorController");

// GET /api/competitor/tags?videoUrl=YOUTUBE_URL
// Extract tags from a competitor's YouTube video
router.get("/tags", competitorController.getVideoTags);

// GET /api/competitor/channel-keywords?channelUrl=YOUTUBE_CHANNEL_URL
// Extract keywords from a competitor's YouTube channel
router.get("/channel-keywords", competitorController.getChannelKeywords);

module.exports = router;
