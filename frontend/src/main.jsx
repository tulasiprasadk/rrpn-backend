import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import axios from "axios";

// Detect environment
const isDev = import.meta.env.DEV;

// --------------------
// Axios configuration
// --------------------
// Dev  → use relative URLs (Vite proxy or same-origin)
// Prod → use Render backend
axios.defaults.baseURL = isDev
  ? ""
  : import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

// --------------------
// Router basename
// --------------------
// Dev  → "/"
// Prod → "/rrnagar-coming-soon"
const baseName =
  !isDev && import.meta.env.VITE_BASE_URL
    ? import.meta.env.VITE_BASE_URL
    : "/";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={baseName}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
