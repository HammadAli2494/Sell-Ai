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

export async function listPublicStoresRequest(params = {}) {
  const response = await api.get("/public/stores", { params });
  return response.data.data;
}

export async function listPublicMarketplaceProductsRequest(params = {}) {
  const response = await api.get("/public/products", { params });
  return response.data.data;
}

export async function listPublicMarketplaceCategoriesRequest() {
  const response = await api.get("/public/categories");
  return response.data.data.categories;
}
