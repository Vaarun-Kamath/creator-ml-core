const { v4: uuidv4 } = require("uuid");
const youtubeAuditService = require("../services/youtubeAuditService");

// Simulated in-memory job queue
let jobs = [];

/**
 * Add a new audit job to the queue
 * @param {string} url - YouTube video or channel URL
 * @returns {string} jobId - Unique identifier for the job
 */
const addJob = (url) => {
	// Create unique job ID
	const jobId = uuidv4();

	// Create job object
	const job = {
		id: jobId,
		url: url,
		status: "pending",
		createdAt: new Date(),
		updatedAt: new Date(),
		result: null,
		error: null,
	};

	// Add to jobs array
	jobs.push(job);

	console.log(`📝 Job added to queue: ${jobId}`);

	// Start background processing (simulate worker)
	processJob(jobId);

	return jobId;
};

/**
 * Get a job by its ID
 * @param {string} jobId - The job identifier
 * @returns {Object|null} job - The job object or null if not found
 */
const getJob = (jobId) => {
	return jobs.find((job) => job.id === jobId) || null;
};

/**
 * Simulate background worker processing
 * @param {string} jobId - The job identifier to process
 */
const processJob = async (jobId) => {
	try {
		// Find the job
		const job = jobs.find((j) => j.id === jobId);
		if (!job) {
			console.error(`❌ Job not found: ${jobId}`);
			return;
		}

		console.log(`🔄 Starting processing for job: ${jobId}`);

		// Update status to processing
		job.status = "processing";
		job.updatedAt = new Date();

		// Simulate processing time (10 seconds)
		await new Promise((resolve) => setTimeout(resolve, 10000));

		// Call the audit service to perform the actual audit
		const auditResult = await youtubeAuditService.performAudit(job.url);

		// Update job with completed status and results
		job.status = "completed";
		job.result = auditResult;
		job.updatedAt = new Date();

		console.log(`✅ Job completed: ${jobId}`);
	} catch (error) {
		console.error(`❌ Job failed: ${jobId}`, error);

		// Update job with failed status
		const job = jobs.find((j) => j.id === jobId);
		if (job) {
			job.status = "failed";
			job.error = error.message;
			job.updatedAt = new Date();
		}
	}
};

/**
 * Get all jobs (for debugging/admin purposes)
 * @returns {Array} jobs - Array of all jobs
 */
const getAllJobs = () => {
	return jobs;
};

/**
 * Clear all jobs (for testing purposes)
 */
const clearAllJobs = () => {
	jobs = [];
	console.log("🧹 All jobs cleared");
};

module.exports = {
	addJob,
	getJob,
	getAllJobs,
	clearAllJobs,
};
