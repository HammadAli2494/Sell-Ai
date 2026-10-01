const API = process.env.API_URL || "http://localhost:5000/api";
const suffix = Date.now();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, { method = "GET", token, headers = {}, body, expected } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (expected && response.status !== expected) {
    throw new Error(
      `${method} ${path} expected ${expected} got ${response.status}: ${payload.message || JSON.stringify(payload)}`,
    );
  }
  return { status: response.status, payload };
}

async function waitForMerchantOrder(token, orderId, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await request("/orders", { token });
    const found = result.payload?.data?.items?.some((item) => item.id === orderId);
    if (found) {
      return result.payload.data.items.find((item) => item.id === orderId);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Merchant orders poll did not see the new order");
}

async function main() {
  const health = await request("/health", { expected: 200 });
  assert(health.payload?.data?.status === "ok", "API health check failed");
  assert(health.payload?.data?.database === "connected", "PostgreSQL is not connected");

  const merchantA = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Merchant A",
      email: `merchant.a.${suffix}@example.com`,
      password: "password12",
    },
    expected: 201,
  });
  const merchantB = await request("/auth/register", {
    method: "POST",
    body: {
      name: "Merchant B",
      email: `merchant.b.${suffix}@example.com`,
      password: "password12",
    },
    expected: 201,
  });

  const tokenA = merchantA.payload.data.token;
  const tokenB = merchantB.payload.data.token;
  assert(merchantA.payload.data.user.role === "MERCHANT", "Merchant A role is wrong");

  const storeA = await request("/stores", {
    method: "POST",
    token: tokenA,
    body: { name: `Hammad Fashion ${suffix}`, description: "Isolation store A" },
    expected: 201,
  });
  const storeB = await request("/stores", {
    method: "POST",
    token: tokenB,
    body: { name: `Tech Zone ${suffix}`, description: "Isolation store B" },
    expected: 201,
  });

  const slugA = storeA.payload.data.store.slug;
  const slugB = storeB.payload.data.store.slug;
  assert(slugA, "Store A slug missing");
  assert(slugB && slugA !== slugB, "Store slugs must be unique");

  const customerAsMerchant = await request("/stores", {
    method: "POST",
    token: tokenA,
    body: { name: "Second Store", description: "Should fail" },
    expected: 409,
  });
  assert(customerAsMerchant.payload.success === false, "Second store should be rejected");

  const category = await request("/categories", {
    method: "POST",
    token: tokenA,
    body: { name: "Dresses" },
    expected: 201,
  });

  const product = await request("/products", {
    method: "POST",
    token: tokenA,
    body: {
      name: "Silk Shirt",
      description: "A storefront test product",
      price: 42.5,
      stock: 8,
      categoryId: category.payload.data.category.id,
      isActive: true,
    },
    expected: 201,
  });

  const publicStore = await request(`/stores/slug/${slugA}`, { expected: 200 });
  assert(publicStore.payload.data.store.name.includes("Hammad Fashion"), "Public store did not load by slug");

  const publicProducts = await request(`/products/public/${slugA}`, { expected: 200 });
  assert(
    publicProducts.payload.data.items.some((item) => item.id === product.payload.data.product.id),
    "Public storefront is missing the merchant product",
  );

  const guestCheckout = await request(`/orders/checkout?slug=${slugA}`, {
    method: "POST",
    body: {
      name: "Guest",
      address: "1 Main Street",
      city: "Austin",
      country: "US",
    },
    expected: 401,
  });
  assert(guestCheckout.payload.success === false, "Guest checkout must be blocked");

  const customerA = await request("/auth/customer/register", {
    method: "POST",
    body: {
      name: "Customer A",
      email: `customer.a.${suffix}@example.com`,
      password: "password12",
    },
    expected: 201,
  });
  const customerB = await request("/auth/customer/register", {
    method: "POST",
    body: {
      name: "Customer B",
      email: `customer.b.${suffix}@example.com`,
      password: "password12",
    },
    expected: 201,
  });

  const customerTokenA = customerA.payload.data.token;
  const customerTokenB = customerB.payload.data.token;
  assert(customerA.payload.data.user.role === "CUSTOMER", "Customer A role is wrong");

  const merchantDashboardAsCustomer = await request("/orders", {
    token: customerTokenA,
    expected: 403,
  });
  assert(merchantDashboardAsCustomer.payload.success === false, "Customer must not list merchant orders");

  const cart = await request(`/cart/items?slug=${slugA}`, {
    method: "POST",
    body: { productId: product.payload.data.product.id, quantity: 2 },
    expected: 200,
  });
  const cartId = cart.payload.data.cart.id;
  assert(cartId, "Cart id missing");
  assert(cart.payload.data.cart.subtotal === 85, `Unexpected cart subtotal ${cart.payload.data.cart.subtotal}`);

  const checkout = await request(`/orders/checkout?slug=${slugA}`, {
    method: "POST",
    token: customerTokenA,
    headers: { "X-Cart-Id": cartId },
    body: {
      name: "Customer A",
      phone: "555-0100",
      address: "100 Market Street",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "United States",
    },
    expected: 201,
  });

  const order = checkout.payload.data.order;
  assert(order.status === "PENDING", "New order should be PENDING");
  assert(order.paymentStatus === "UNPAID", "New order should be UNPAID");
  assert(order.shippingAddress === "100 Market Street", "Shipping snapshot was not stored");
  assert(order.items.length === 1 && order.items[0].quantity === 2, "Order items were not stored");

  const polledOrder = await waitForMerchantOrder(tokenA, order.id);
  assert(polledOrder.id === order.id, "Merchant poll received the wrong order");

  const merchantOrders = await request("/orders", { token: tokenA, expected: 200 });
  assert(
    merchantOrders.payload.data.items.some((item) => item.id === order.id),
    "Merchant A cannot see the new order",
  );

  const merchantBOrders = await request("/orders", { token: tokenB, expected: 200 });
  assert(
    !merchantBOrders.payload.data.items.some((item) => item.id === order.id),
    "Merchant B can see Merchant A's order",
  );

  const merchantBDirect = await request(`/orders/${order.id}`, { token: tokenB, expected: 404 });
  assert(merchantBDirect.payload.success === false, "Merchant B IDOR should fail");

  const myOrders = await request("/orders/me", { token: customerTokenA, expected: 200 });
  assert(
    myOrders.payload.data.items.some((item) => item.id === order.id),
    "Customer A cannot see their order",
  );

  const customerBDirect = await request(`/orders/me/${order.id}`, { token: customerTokenB, expected: 404 });
  assert(customerBDirect.payload.success === false, "Customer B IDOR should fail");

  const updated = await request(`/orders/${order.id}`, {
    method: "PATCH",
    token: tokenA,
    body: { status: "PROCESSING" },
    expected: 200,
  });
  assert(updated.payload.data.order.status === "PROCESSING", "Merchant could not update status");

  const customerOrder = await request(`/orders/me/${order.id}`, { token: customerTokenA, expected: 200 });
  assert(customerOrder.payload.data.order.status === "PROCESSING", "Customer did not see updated status");

  const merchantBStatus = await request(`/orders/${order.id}`, {
    method: "PATCH",
    token: tokenB,
    body: { status: "SHIPPED" },
    expected: 404,
  });
  assert(merchantBStatus.payload.success === false, "Merchant B must not update Store A orders");

  const analytics = await request("/analytics", { token: tokenA, expected: 200 });
  assert(analytics.payload.data.analytics.totals.salesCount >= 1, "Analytics did not include the new order");
  assert(analytics.payload.data.analytics.totals.products >= 1, "Analytics product count is wrong");

  console.log("E2E verification passed");
  console.log(`Store A slug: ${slugA}`);
  console.log(`Store B slug: ${slugB}`);
  console.log(`Order id: ${order.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
