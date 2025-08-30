const express = require("express");
const {
    createProject,
    getProjects,
} = require("../controllers/projectController");

const router = express.Router();

// POST /api/projects - Create a new project
router.post("/", createProject);

// GET /api/projects - Get all projects for the authenticated user
router.get("/", getProjects);

module.exports = router;
