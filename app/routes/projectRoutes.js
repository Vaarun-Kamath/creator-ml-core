const express = require("express");
const {
    createProject,
    getProjects,
    getProjectById,
} = require("../controllers/projectController");

const router = express.Router();

// POST /api/projects - Create a new project
router.post("/", createProject);

// GET /api/projects - Get all projects for the authenticated user
router.get("/", getProjects);

// GET /api/projects/:projectId - Get a single project by ID
router.get("/:projectId", getProjectById);

module.exports = router;
