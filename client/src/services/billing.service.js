import api from "./api.js";

export async function listPlansRequest() {
  const response = await api.get("/billing/plans");
  return response.data.data.plans;
}

export async function getBillingRequest() {
  const response = await api.get("/billing");
  return response.data.data.billing;
}

export async function createCheckoutRequest(plan) {
  const response = await api.post("/billing/checkout", { plan });
  return response.data.data;
}

export async function createPortalRequest() {
  const response = await api.post("/billing/portal");
  return response.data.data;
}
