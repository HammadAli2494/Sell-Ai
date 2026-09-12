import api from "./api.js";

export async function getMyStoreRequest() {
  const response = await api.get("/stores/me");
  return response.data.data.store;
}

export async function createStoreRequest(payload) {
  const response = await api.post("/stores", payload);
  return response.data.data.store;
}

export async function updateMyStoreRequest(payload) {
  const response = await api.patch("/stores/me", payload);
  return response.data.data.store;
}

export async function getPublicStoreRequest(slug) {
  const response = await api.get(`/stores/slug/${slug}`);
  return response.data.data.store;
}
