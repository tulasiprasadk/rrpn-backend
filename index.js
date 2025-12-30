import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./routes/index.js";
import "./config/database.js"; // ensure DB connection

const app = express();


// Middleware

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rrw-frontend.vercel.app",
      "https://rrw-frontend-bshkgchh2-prasads-projects-1f1a36aa.vercel.app"
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());


// Routes

app.use("/api", routes);

/* =========================
   Start server (local)
========================= */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
