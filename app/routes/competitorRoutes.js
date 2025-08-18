const express = require("express");
const router = express.Router();
const competitorController = require("../controllers/competitorController");

// GET /api/competitor/tags?videoUrl=YOUTUBE_URL
// Extract tags from a competitor's YouTube video
router.get("/tags", competitorController.getVideoTags);

module.exports = router;
