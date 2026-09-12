import api from "./api.js";
import { getCartId } from "../utils/cartStorage.js";

function cartHeaders(slug) {
  const cartId = getCartId(slug);
  return {
    params: { slug },
    headers: cartId ? { "X-Cart-Id": cartId } : {},
  };
}

export async function getCartRequest(slug) {
  const response = await api.get("/cart", cartHeaders(slug));
  return response.data.data.cart;
}

export async function addCartItemRequest(slug, payload) {
  const response = await api.post("/cart/items", payload, cartHeaders(slug));
  return response.data.data.cart;
}

export async function updateCartItemRequest(slug, itemId, payload) {
  const response = await api.patch(`/cart/items/${itemId}`, payload, cartHeaders(slug));
  return response.data.data.cart;
}

export async function removeCartItemRequest(slug, itemId) {
  const response = await api.delete(`/cart/items/${itemId}`, cartHeaders(slug));
  return response.data.data.cart;
}

export async function checkoutRequest(slug, payload) {
  const response = await api.post("/orders/checkout", payload, cartHeaders(slug));
  return response.data.data.order;
}

export async function getPublicOrderRequest(slug, orderId, email) {
  const response = await api.get(`/orders/public/${orderId}`, {
    params: { slug, email },
  });
  return response.data.data.order;
}

export async function listPublicOrdersRequest(slug, email, params = {}) {
  const response = await api.get("/orders/public", {
    params: { slug, email, ...params },
  });
  return response.data.data;
}

export async function listMerchantOrders(params = {}) {
  const response = await api.get("/orders", { params });
  return response.data.data;
}

export async function updateOrderStatusRequest(orderId, status) {
  const response = await api.patch(`/orders/${orderId}`, { status });
  return response.data.data.order;
}
