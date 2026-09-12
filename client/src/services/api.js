import axios from "axios";
import { getToken } from "../utils/tokenStorage.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error, fallback = "Something went wrong") {
  return error.response?.data?.message || error.message || fallback;
}

export async function checkHealth() {
  const response = await api.get("/health");
  return response.data.data;
}

export default api;
