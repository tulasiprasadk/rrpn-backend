// Diagnostic Bootloader for Vercel
// This wraps the backend import to catch startup crashes (missing modules, syntax errors)
// and report them to the browser instead of returning a generic 404.

export default async function handler(req, res) {
  try {
    // Dynamically load the backend app
    const appModule = await import('../backend/index.js');
    const app = appModule.default;
    
    // Pass the request to the Express app
    return app(req, res);
  } catch (err) {
    console.error("CRITICAL: Backend startup failed:", err);
    res.status(500).json({
      error: "Backend Startup Failed",
      message: err.message,
      stack: err.stack,
      hint: "Check if all files referenced in imports are present in the git repo."
    });
  }
}