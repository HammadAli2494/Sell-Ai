import api from "./api.js";

export async function listCustomersRequest(params = {}) {
  const response = await api.get("/customers", { params });
  return response.data.data;
}
