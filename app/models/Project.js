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
        savedKeywords: {
            type: [{
                keyword: {
                    type: String,
                    required: [true, "Keyword is required"],
                    trim: true,
                    maxlength: [200, "Keyword cannot exceed 200 characters"],
                },
                competition: {
                    type: Number,
                    required: [true, "Competition score is required"],
                    min: [0, "Competition score cannot be negative"],
                    max: [100, "Competition score cannot exceed 100"],
                },
                demand: {
                    type: Number,
                    required: [true, "Demand score is required"],
                    min: [0, "Demand score cannot be negative"],
                },
                addedAt: {
                    type: Date,
                    default: Date.now,
                }
            }],
            default: [], // Initialize as empty array
            validate: {
                validator: function (keywords) {
                    return keywords.length <= 1000; // Limit to 1000 keywords per project
                },
                message: "Cannot exceed 1000 keywords per project"
            }
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
