import serverless from "serverless-http";
import app from "./express-app.js";
import { initDatabase } from "../config/database.js";

const dbInitialized = initDatabase();
const handler = serverless(app);

export default async function vercelHandler(req, res) {
  await dbInitialized;
  return handler(req, res);
}
