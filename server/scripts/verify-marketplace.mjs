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
    throw new Error(`${method} ${path} expected ${expected} got ${response.status}: ${JSON.stringify(payload)}`);
  }
  return { status: response.status, payload };
}

async function createCatalog(token, { storeName, description, categoryName, products }) {
  const created = await request("/stores", {
    method: "POST",
    token,
    body: { name: storeName, description },
    expected: 201,
  });
  const store = created.payload.data.store;
  assert(store.isActive === false, `${storeName} should start as a draft`);

  const publicBefore = await request("/public/stores", { expected: 200 });
  assert(
    !publicBefore.payload.data.items.some((item) => item.slug === store.slug),
    `Draft store ${store.slug} appeared on Browse Stores`,
  );

  await request("/stores/me", { method: "PATCH", token, body: { isActive: true }, expected: 200 });

  const category = await request("/categories", {
    method: "POST",
    token,
    body: { name: categoryName },
    expected: 201,
  });

  const createdProducts = [];
  for (const product of products) {
    const result = await request("/products", {
      method: "POST",
      token,
      body: {
        ...product,
        categoryId: category.payload.data.category.id,
        isActive: true,
      },
      expected: 201,
    });
    createdProducts.push(result.payload.data.product);
  }

  return { store, products: createdProducts };
}

async function main() {
  const listed = await request("/public/stores", { expected: 200 });
  assert(Array.isArray(listed.payload.data.items), "Public stores list is missing");

  const merchantA = await request("/auth/register", {
    method: "POST",
    body: { name: "Hammad Merchant", email: `hammad.tech.${suffix}@example.com`, password: "password12" },
    expected: 201,
  });
  const merchantB = await request("/auth/register", {
    method: "POST",
    body: { name: "Fashion Merchant", email: `fashion.zone.${suffix}@example.com`, password: "password12" },
    expected: 201,
  });

  const storeA = await createCatalog(merchantA.payload.data.token, {
    storeName: `Hammad Tech ${suffix}`,
    description: "Electronics and accessories",
    categoryName: "Electronics",
    products: [
      { name: "USB-C Hub", description: "7-in-1 hub", price: 49, stock: 12, imageUrl: "https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=800&q=80" },
      { name: "Wireless Mouse", description: "Quiet click mouse", price: 29, stock: 20, imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80" },
      { name: "Laptop Sleeve", description: "13-inch sleeve", price: 24, stock: 15, imageUrl: "https://images.unsplash.com/photo-1541807084-5d52b6ee8a85?auto=format&fit=crop&w=800&q=80" },
    ],
  });
  const storeB = await createCatalog(merchantB.payload.data.token, {
    storeName: `Fashion Zone ${suffix}`,
    description: "Apparel and accessories",
    categoryName: "Apparel",
    products: [
      { name: "Linen Shirt", description: "Everyday shirt", price: 38, stock: 10, imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
      { name: "Canvas Tote", description: "Weekend tote", price: 22, stock: 18, imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
      { name: "Wool Scarf", description: "Soft winter scarf", price: 27, stock: 14, imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80" },
    ],
  });

  const afterPublish = await request("/public/stores?limit=50", { expected: 200 });
  const slugs = afterPublish.payload.data.items.map((item) => item.slug);
  assert(slugs.includes(storeA.store.slug), "Hammad Tech did not appear after publish");
  assert(slugs.includes(storeB.store.slug), "Fashion Zone did not appear after publish");

  const publicA = await request(`/public/stores/${storeA.store.slug}`, { expected: 200 });
  assert(publicA.payload.data.store.name.includes("Hammad Tech"), "Public store slug loaded the wrong store");

  const productsA = await request(`/products/public/${storeA.store.slug}`, { expected: 200 });
  const productsB = await request(`/products/public/${storeB.store.slug}`, { expected: 200 });
  assert(productsA.payload.data.items.length === 3, "Hammad Tech should have 3 products");
  assert(
    productsA.payload.data.items.every((item) => !productsB.payload.data.items.some((other) => other.id === item.id)),
    "Store catalogs leaked across merchants",
  );

  const customer = await request("/auth/customer/register", {
    method: "POST",
    body: { name: "Marketplace Buyer", email: `buyer.${suffix}@example.com`, password: "password12" },
    expected: 201,
  });

  const cart = await request(`/cart/items?slug=${storeA.store.slug}`, {
    method: "POST",
    body: { productId: storeA.products[0].id, quantity: 1 },
    expected: 200,
  });

  const checkout = await request(`/orders/checkout?slug=${storeA.store.slug}`, {
    method: "POST",
    token: customer.payload.data.token,
    headers: { "X-Cart-Id": cart.payload.data.cart.id },
    body: {
      name: "Marketplace Buyer",
      address: "12 Tech Street",
      city: "Austin",
      country: "United States",
    },
    expected: 201,
  });

  const orderId = checkout.payload.data.order.id;
  const merchantAOrders = await request("/orders", { token: merchantA.payload.data.token, expected: 200 });
  const merchantBOrders = await request("/orders", { token: merchantB.payload.data.token, expected: 200 });
  assert(merchantAOrders.payload.data.items.some((item) => item.id === orderId), "Merchant A did not receive the order");
  assert(!merchantBOrders.payload.data.items.some((item) => item.id === orderId), "Merchant B saw Merchant A's order");

  const myOrders = await request("/orders/me", { token: customer.payload.data.token, expected: 200 });
  assert(myOrders.payload.data.items.some((item) => item.id === orderId), "Customer did not see their order");

  console.log("Marketplace verification passed");
  console.log(`Hammad Tech slug: ${storeA.store.slug}`);
  console.log(`Fashion Zone slug: ${storeB.store.slug}`);
  console.log(`Order id: ${orderId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
