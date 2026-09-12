import api from "./api.js";

export async function getAnalyticsRequest(params = {}) {
  const response = await api.get("/analytics", { params });
  return response.data.data.analytics;
}
