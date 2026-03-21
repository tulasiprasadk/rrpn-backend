// Cloud Run Entry Point
// This file is specifically for Google Cloud Run deployment
// Cloud Run expects a named export 'handler'

import "./api/index.js";

// Re-export the handler from api/index.js
export { handler } from "./api/index.js";
