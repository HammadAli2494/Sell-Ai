const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseCartId(value) {
  const cartId = Array.isArray(value) ? value[0] : value;

  if (typeof cartId !== "string") {
    return undefined;
  }

  const trimmed = cartId.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : undefined;
}
