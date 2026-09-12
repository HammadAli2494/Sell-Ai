const cartKey = (slug) => `sellai_cart_${slug}`;

export function getCartId(slug) {
  return localStorage.getItem(cartKey(slug));
}

export function setCartId(slug, cartId) {
  if (!cartId) {
    localStorage.removeItem(cartKey(slug));
    return;
  }
  localStorage.setItem(cartKey(slug), cartId);
}

export function clearCartId(slug) {
  localStorage.removeItem(cartKey(slug));
}
