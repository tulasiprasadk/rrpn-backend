import axios from "axios";
import { API_BASE, resolveApiRequestUrl, sanitizeBase64DataUrl } from "../config/api";

function getTokenForRequest(url = "") {
  const normalizedUrl = String(url || "");
  const customerToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");
  const supplierToken = localStorage.getItem("supplierToken");

  if (normalizedUrl.includes("/admin")) {
    return adminToken || customerToken || supplierToken;
  }

  if (normalizedUrl.includes("/supplier")) {
    return supplierToken || customerToken || adminToken;
  }

  return customerToken || adminToken || supplierToken;
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// Attach Authorization header with JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const nextUrl = resolveApiRequestUrl(config.url || "");
    if (nextUrl) {
      config.url = nextUrl;
    }
    const token = getTokenForRequest(config.url || "");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Normalize URL-like fields before sending to backend to avoid strict @IsUrl
    // validation failures on the server. This is conservative and only prepends
    // `https://` when a string looks like a domain/path but lacks a protocol.
    try {
      if (config && config.data && typeof config.data === 'object') {
        const urlKeys = ['url', 'link', 'website', 'image', 'websiteUrl', 'photo', 'upiUri'];
        for (const key of urlKeys) {
          if (Object.prototype.hasOwnProperty.call(config.data, key)) {
            const val = config.data[key];
            if (typeof val === 'string' && val.length > 0 && !/^\w+:\/\//.test(val)) {
              // If it looks like a domain (contains a dot) or starts with www, prefix https://
              if (/^www\.|\./.test(val)) {
                config.data[key] = `https://${val}`;
              }
            }
          }
        }

        if (Object.prototype.hasOwnProperty.call(config.data, "paymentEvidence")) {
          config.data.paymentEvidence = sanitizeBase64DataUrl(config.data.paymentEvidence);
        }
      }
    } catch (e) {
      // Don't block requests if normalization fails; just continue.
      console.warn('URL normalization failed:', e?.message || e);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      error.message = 'Unable to connect to server. Please check your internet connection.';
    }
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    }
    // Handle 5xx errors
    if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    // Handle 404 errors
    if (error.response?.status === 404) {
      error.message = 'Resource not found.';
    }
    return Promise.reject(error);
  }
);

// Do not export API_BASE directly. Always import where needed.
export default api;



