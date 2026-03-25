import serverless from "serverless-http";
import app from "../backend/api/express-app.js";
import { initDatabase } from "../backend/config/database.js";

// Kick off DB initialization in the background. Do not block request handling,
// because health checks and lightweight routes should still respond while the
// database is warming up on serverless platforms.
const dbInitialized = initDatabase().catch((err) => {
  console.error("Background DB init failed:", err);
});
const handler = serverless(app);

export default async function vercelHandler(req, res) {
  void dbInitialized;
  return handler(req, res);
}
