import serverless from "serverless-http";
import app from "./express-app.js";
import { initDatabase } from "../config/database.js";

const dbInitialized = initDatabase().catch((err) => {
  console.error("Background DB init failed:", err);
});
const handler = serverless(app);

export default async function vercelHandler(req, res) {
  void dbInitialized;
  return handler(req, res);
}
