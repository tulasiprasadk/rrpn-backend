import serverless from 'serverless-http';
import app from '../backend/api/express-app.js';
import { initDatabase } from '../backend/config/database.js';

// Initialize the database connection.
// This starts the connection process immediately when the function is loaded.
const dbInitialized = initDatabase();

// Wrap the Express app with serverless-http
const handler = serverless(app);

export default async function (req, res) {
  await dbInitialized;
  return handler(req, res);
}