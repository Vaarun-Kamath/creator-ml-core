const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

// POST /api/audit/request
// Body: { videoUrl: "https://youtube.com/watch?v=..." }
// Creates a new audit job and returns jobId
router.post("/request", auditController.requestAudit);

// GET /api/audit/status/:jobId
// Returns the current status and results of an audit job
router.get("/status/:jobId", auditController.getAuditStatus);

module.exports = router;
