import app from "./express-app.js";
import { initDatabase } from "../config/database.js";

// Initialize the database connection.
// This starts the connection process immediately when the function is loaded.
const dbInitialized = initDatabase();

export default async function handler(req, res) {
  await dbInitialized;
  return app(req, res);
}
