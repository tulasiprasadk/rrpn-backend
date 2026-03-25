import serverless from "serverless-http";
import app from "../backend/api/express-app.js";
import { initDatabase } from "../backend/config/database.js";

// Initialize the database connection when the function loads so route handlers
// can reuse it across warm invocations.
const dbInitialized = initDatabase();
const handler = serverless(app);

export default async function vercelHandler(req, res) {
  await dbInitialized;
  return handler(req, res);
}
