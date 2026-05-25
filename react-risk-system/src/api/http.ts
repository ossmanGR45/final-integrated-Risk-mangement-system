import axios from "axios";

// Centralized API base URL. Change this once if the backend host changes.
// Dynamically check if the React app is served on Docker port 3001
const isDocker = typeof window !== 'undefined' && window.location.port === '3001';
export const API_BASE = isDocker
  ? "http://localhost:7002/api"
  : "https://localhost:7002/api";

export const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Always attach the bearer token if one is stored.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});
