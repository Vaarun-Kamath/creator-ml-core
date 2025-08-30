const Project = require("../models/Project");

// Create a new project
const createProject = async (req, res) => {
    try {
        const { title } = req.body;
        const userId = req.headers["x-user-id"];

        // Validate required fields
        if (!title) {
            return res.status(400).json({
                status: "error",
                message: "Project title is required",
            });
        }

        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "User ID is required in x-user-id header",
            });
        }

        // Create new project
        const project = new Project({
            title: title.trim(),
            userId,
        });

        // Save to database
        const savedProject = await project.save();

        res.status(201).json({
            status: "success",
            message: "Project created successfully",
            data: {
                project: savedProject,
            },
        });
    } catch (error) {
        console.error("Error creating project:", error);

        // Handle MongoDB validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "error",
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(409).json({
                status: "error",
                message: "A project with this information already exists",
            });
        }

        res.status(500).json({
            status: "error",
            message: "Internal server error while creating project",
        });
    }
};

// Get all projects for a user
const getProjects = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "User ID is required in x-user-id header",
            });
        }

        // Find all projects for the user, sorted by creation date (newest first)
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            message: "Projects retrieved successfully",
            data: {
                projects,
                count: projects.length,
            },
        });
    } catch (error) {
        console.error("Error retrieving projects:", error);

        res.status(500).json({
            status: "error",
            message: "Internal server error while retrieving projects",
        });
    }
};

module.exports = {
    createProject,
    getProjects,
};
