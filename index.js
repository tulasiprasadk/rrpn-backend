import serverless from 'serverless-http';
import app from '../backend/index.js';

// Use serverless-http to bridge Vercel and Express
// This ensures proper request handling and bundling
export default serverless(app);