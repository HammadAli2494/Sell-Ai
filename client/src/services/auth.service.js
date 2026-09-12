import api from "./api.js";

export async function registerRequest(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
}

export async function loginRequest(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
}

export async function logoutRequest() {
  await api.post("/auth/logout");
}

export async function getCurrentUserRequest() {
  const response = await api.get("/auth/me");
  return response.data.data.user;
}
