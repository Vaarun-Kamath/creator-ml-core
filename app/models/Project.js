const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Project title is required"],
            trim: true,
            maxlength: [100, "Project title cannot exceed 100 characters"],
        },
        userId: {
            type: String,
            required: [true, "User ID is required"],
            index: true, // Index for efficient queries by userId
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

// Create a compound index for efficient queries
ProjectSchema.index({ userId: 1, createdAt: -1 });

const Project = mongoose.model("Project", ProjectSchema);

module.exports = Project;
