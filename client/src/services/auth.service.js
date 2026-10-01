import api from "./api.js";

export async function registerRequest(payload) {
  const response = await api.post("/auth/register", payload, { skipToast: true });
  return response.data.data;
}

export async function registerCustomerRequest(payload) {
  const response = await api.post("/auth/customer/register", payload, { skipToast: true });
  return response.data.data;
}

export async function loginRequest(payload) {
  const response = await api.post("/auth/login", payload, { skipToast: true });
  return response.data.data;
}

export async function logoutRequest() {
  await api.post("/auth/logout", null, { skipToast: true });
}

export async function getCurrentUserRequest() {
  const response = await api.get("/auth/me", { skipToast: true });
  return response.data.data.user;
}

export async function updateProfileRequest(payload) {
  const response = await api.patch("/auth/me", payload);
  return response.data.data.user;
}

export async function changePasswordRequest(payload) {
  const response = await api.post("/auth/password", payload);
  return response.data.data;
}
