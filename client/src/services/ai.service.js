import api from "./api.js";

export async function getAiUsageRequest() {
  const response = await api.get("/ai/usage");
  return response.data.data.usage;
}

export async function generateAiRequest(payload) {
  const response = await api.post("/ai/generate", payload, { skipToast: true, timeout: 90000 });
  return response.data.data;
}

export async function getPublicAiStatusRequest(slug) {
  const response = await api.get(`/ai/public/${slug}`);
  return response.data.data;
}

export async function sendStoreChatRequest(slug, messages) {
  const response = await api.post(`/ai/public/${slug}/chat`, { messages }, { skipToast: true, timeout: 90000 });
  return response.data.data;
}
