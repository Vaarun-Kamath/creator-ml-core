const auditQueue = require("../jobs/auditQueue");

/**
 * Request a new video/channel audit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestAudit = async (req, res) => {
	try {
		// Get video URL from request body
		const { url } = req.body;

		// Validate URL
		if (!url) {
			return res.status(400).json({
				status: "error",
				message: "URL is required. Please provide a url in the request body.",
			});
		}

		// Basic YouTube URL validation
		const isValidYouTubeUrl =
			/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url);
		if (!isValidYouTubeUrl) {
			return res.status(400).json({
				status: "error",
				message: "Please provide a valid YouTube URL.",
			});
		}

		// Add job to queue
		const jobId = auditQueue.addJob(url);

		console.log(`🎯 New audit job created: ${jobId} for URL: ${url}`);

		// Return 202 Accepted with jobId
		res.status(202).json({
			status: "accepted",
			message: "Audit job has been queued for processing",
			jobId: jobId,
			estimatedProcessingTime: "30-60 seconds",
			checkStatusUrl: `/api/audit/status/${jobId}`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in requestAudit:", error);
		res.status(500).json({
			status: "error",
			message: "Internal server error while creating audit job",
		});
	}
};

/**
 * Get the status of an audit job
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAuditStatus = async (req, res) => {
	try {
		// Get jobId from route parameters
		const { jobId } = req.params;

		// Get job from queue
		const job = auditQueue.getJob(jobId);

		if (!job) {
			return res.status(404).json({
				status: "error",
				message: "Job not found. Please check the jobId and try again.",
			});
		}

		// Prepare response based on job status
		const response = {
			status: "success",
			jobId: job.id,
			jobStatus: job.status,
			videoUrl: job.videoUrl,
			createdAt: job.createdAt,
			updatedAt: job.updatedAt,
		};

		// Add additional fields based on status
		if (job.status === "completed") {
			response.result = job.result;
			response.processingTime = `${Math.round(
				(job.updatedAt - job.createdAt) / 1000
			)} seconds`;
		} else if (job.status === "processing") {
			response.message =
				"Audit is currently being processed. Please check back in a few moments.";
		} else if (job.status === "pending") {
			response.message = "Audit is queued and will begin processing shortly.";
		} else if (job.status === "failed") {
			response.error = job.error;
			response.message = "Audit failed to complete. Please try again.";
		}

		res.status(200).json(response);
	} catch (error) {
		console.error("Error in getAuditStatus:", error);
		res.status(500).json({
			status: "error",
			message: "Internal server error while checking audit status",
		});
	}
};

module.exports = {
	requestAudit,
	getAuditStatus,
};
