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

// Get a single project by ID
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                status: "error",
                message: "User ID is required in x-user-id header",
            });
        }

        if (!projectId) {
            return res.status(400).json({
                status: "error",
                message: "Project ID is required",
            });
        }

        // Find the project by ID and ensure it belongs to the user
        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.status(404).json({
                status: "error",
                message: "Project not found or you don't have access to it",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Project retrieved successfully",
            data: {
                project,
            },
        });
    } catch (error) {
        console.error("Error retrieving project:", error);

        // Handle invalid ObjectId format
        if (error.name === "CastError") {
            return res.status(400).json({
                status: "error",
                message: "Invalid project ID format",
            });
        }

        res.status(500).json({
            status: "error",
            message: "Internal server error while retrieving project",
        });
    }
};

// Add a keyword to a project
const addKeywordToProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { keyword, competition, demand } = req.body;
        const userId = req.headers["x-user-id"];

        // Validate authentication
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "User ID is required in x-user-id header",
            });
        }

        // Validate required parameters
        if (!projectId) {
            return res.status(400).json({
                status: "error",
                message: "Project ID is required",
            });
        }

        // Validate required body fields
        if (!keyword || competition === undefined || demand === undefined) {
            return res.status(400).json({
                status: "error",
                message: "Keyword, competition, and demand are required fields",
            });
        }

        // Validate data types and ranges
        if (typeof keyword !== 'string' || keyword.trim().length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Keyword must be a non-empty string",
            });
        }

        if (typeof competition !== 'number' || competition < 0 || competition > 100) {
            return res.status(400).json({
                status: "error",
                message: "Competition must be a number between 0 and 100",
            });
        }

        if (typeof demand !== 'number' || demand < 0) {
            return res.status(400).json({
                status: "error",
                message: "Demand must be a non-negative number",
            });
        }

        // Find the project and verify ownership
        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.status(404).json({
                status: "error",
                message: "Project not found or you don't have access to it",
            });
        }

        // Check if keyword already exists in the project
        const existingKeyword = project.savedKeywords.find(
            k => k.keyword.toLowerCase() === keyword.trim().toLowerCase()
        );

        if (existingKeyword) {
            return res.status(409).json({
                status: "error",
                message: "This keyword already exists in the project",
                data: {
                    existingKeyword
                }
            });
        }

        // Create the new keyword object
        const newKeyword = {
            keyword: keyword.trim(),
            competition: Number(competition),
            demand: Number(demand),
            addedAt: new Date()
        };

        // Add the keyword to the project
        project.savedKeywords.push(newKeyword);

        // Save the updated project
        const updatedProject = await project.save();

        // Get the newly added keyword (last one in the array)
        const addedKeyword = updatedProject.savedKeywords[updatedProject.savedKeywords.length - 1];

        res.status(201).json({
            status: "success",
            message: "Keyword added to project successfully",
            data: {
                project: updatedProject,
                addedKeyword: addedKeyword,
                totalKeywords: updatedProject.savedKeywords.length
            },
        });

    } catch (error) {
        console.error("Error adding keyword to project:", error);

        // Handle MongoDB validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "error",
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }

        // Handle invalid ObjectId format
        if (error.name === "CastError") {
            return res.status(400).json({
                status: "error",
                message: "Invalid project ID format",
            });
        }

        res.status(500).json({
            status: "error",
            message: "Internal server error while adding keyword to project",
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    addKeywordToProject,
};
