import api from "./api.js";

export async function listMerchantProducts(params = {}) {
  const response = await api.get("/products", { params });
  return response.data.data;
}

export async function createProductRequest(payload) {
  const response = await api.post("/products", payload);
  return response.data.data.product;
}

export async function updateProductRequest(productId, payload) {
  const response = await api.put(`/products/${productId}`, payload);
  return response.data.data.product;
}

export async function deleteProductRequest(productId) {
  await api.delete(`/products/${productId}`);
}

export async function listCategoriesRequest() {
  const response = await api.get("/categories");
  return response.data.data.categories;
}

export async function createCategoryRequest(payload) {
  const response = await api.post("/categories", payload);
  return response.data.data.category;
}

export async function updateCategoryRequest(categoryId, payload) {
  const response = await api.put(`/categories/${categoryId}`, payload);
  return response.data.data.category;
}

export async function deleteCategoryRequest(categoryId) {
  await api.delete(`/categories/${categoryId}`);
}

export async function listPublicProducts(slug, params = {}) {
  const response = await api.get(`/products/public/${slug}`, { params });
  return response.data.data;
}

export async function getPublicProduct(slug, productId) {
  const response = await api.get(`/products/public/${slug}/${productId}`);
  return response.data.data.product;
}

export async function listPublicCategories(slug) {
  const response = await api.get(`/categories/public/${slug}`);
  return response.data.data.categories;
}
