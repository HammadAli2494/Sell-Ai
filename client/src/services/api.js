import axios from "axios";
import { toast } from "react-toastify";
import { clearToken, getToken } from "../utils/tokenStorage.js";

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

const STATUS_MESSAGES = {
  400: "Please check the form and try again.",
  401: "Please log in to continue",
  403: "You are not authorized to perform this action",
  404: "We could not find that resource.",
  409: "That action conflicts with existing data.",
  422: "Please check the form and try again.",
  429: "Too many requests. Please wait and try again.",
  500: "Something went wrong. Please try again.",
  503: "This service is temporarily unavailable.",
};

export function getErrorMessage(error, fallback = "Something went wrong") {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;
  if (status === 500) {
    return STATUS_MESSAGES[500];
  }
  return serverMessage || STATUS_MESSAGES[status] || error.message || fallback;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const skipToast = error.config?.skipToast;
    const message = getErrorMessage(error);

    if (status === 401 && !skipToast) {
      clearToken();
    }

    if (!skipToast) {
      if (status === 401) {
        toast.warning(message);
      } else if (status === 403 || status === 429) {
        toast.error(message);
      } else if (status >= 500) {
        toast.error(STATUS_MESSAGES[500]);
      } else if (!error.response) {
        toast.error("Network error. Please try again.");
      }
    }

    return Promise.reject(error);
  },
);

export async function checkHealth() {
  const response = await api.get("/health", { skipToast: true });
  return response.data.data;
}

export default api;
