// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/',         // keep it relative so Vite can proxy /api -> backend
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send cookies for session support
});

export default api;
