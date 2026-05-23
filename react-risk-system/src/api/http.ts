import axios from "axios";

// Centralized API base URL. Change this once if the backend host changes.
export const API_BASE = "https://localhost:7002/api";

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
