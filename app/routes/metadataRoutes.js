const express = require("express");
const router = express.Router();
const metadataController = require("../controllers/metadataController");

// POST /api/metadata/generate
// Body: { topic: "video topic description" }
// Generate AI-powered metadata for video content
router.post("/generate", metadataController.generateMetadata);

module.exports = router;
