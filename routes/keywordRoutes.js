const express = require("express");
const router = express.Router();
const keywordController = require("../controllers/keywordController");

// GET /api/keywords/research
// Query parameter: seed (required)
// Example: /api/keywords/research?seed=gaming
router.get("/research", keywordController.getKeywordSuggestions);

module.exports = router;
