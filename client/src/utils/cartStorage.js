const cartKey = (slug) => `sellai_cart_${slug}`;
const LAST_SLUG_KEY = "sellai_last_cart_slug";

export function getCartId(slug) {
  return localStorage.getItem(cartKey(slug));
}

export function setCartId(slug, cartId) {
  if (!cartId) {
    localStorage.removeItem(cartKey(slug));
    return;
  }
  localStorage.setItem(cartKey(slug), cartId);
  setLastCartSlug(slug);
}

export function clearCartId(slug) {
  localStorage.removeItem(cartKey(slug));
}

export function getLastCartSlug() {
  return localStorage.getItem(LAST_SLUG_KEY);
}

export function setLastCartSlug(slug) {
  if (!slug) {
    return;
  }
  localStorage.setItem(LAST_SLUG_KEY, slug);
}
