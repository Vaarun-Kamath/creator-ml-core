const dotenv = require("dotenv");

dotenv.config();

// Fetch Google Cloud Platform (GCP) credentials from environment variables
const gcpCredentials = {
	client_id: process.env.GCP_CLIENT_ID,
	client_secret: process.env.GCP_CLIENT_SECRET,
	project_id: process.env.GCP_PROJECT_ID,
	auth_uri: process.env.GCP_AUTH_URI,
	token_uri: process.env.GCP_TOKEN_URI,
	auth_provider_x509_cert_url: process.env.GCP_AUTH_PROVIDER_X509_CERT_URL,
	redirect_uris: process.env.GCP_REDIRECT_URI
		? JSON.parse(process.env.GCP_REDIRECT_URI)
		: [],
};

const youtubeApiKey = {
	key: process.env.YOUTUBE_API_KEY,
};

const geminiApiKey = {
	key: process.env.GEMINI_API_KEY,
};

module.exports = { gcpCredentials, youtubeApiKey, geminiApiKey };
