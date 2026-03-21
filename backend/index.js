/**
 * Local Development Server Entry Point
 * This file imports the Express app and starts a local server.
 * It is NOT used for Vercel deployment.
 */
import 'dotenv/config';
import { app } from './api/express-app.js'; // Note: named import
import { initDatabase } from './config/database.js';

const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});