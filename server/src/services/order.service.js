import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { paginationMeta, parsePagination } from "../utils/pagination.js";

const cartSelect = {
  id: true,
  storeId: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          imageUrl: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

const orderSelect = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      },
    },
  },
};

const customerSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
};

function money(value) {
  return Number(value);
}

function serializeCart(cart) {
  if (!cart) {
    return { id: null, items: [], subtotal: 0 };
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      ...item.product,
      price: money(item.product.price),
    },
    lineTotal: money(item.product.price) * item.quantity,
  }));

  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

function serializeOrder(order) {
  return {
    ...order,
    total: money(order.total),
    items: order.items.map((item) => ({
      ...item,
      price: money(item.price),
    })),
  };
}

async function getCartInStore(cartId, storeId) {
  if (!cartId) {
    return null;
  }

  return prisma.cart.findFirst({
    where: { id: cartId, storeId },
    select: cartSelect,
  });
}

export async function getCart(storeId, cartId) {
  const cart = await getCartInStore(cartId, storeId);
  return serializeCart(cart);
}

export async function addCartItem(storeId, cartId, { productId, quantity }) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId, isActive: true },
    select: { id: true, stock: true },
  });

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  let cart = await getCartInStore(cartId, storeId);
  if (!cart) {
    cart = await prisma.cart.create({
      data: { storeId },
      select: cartSelect,
    });
  }

  const existing = cart.items.find((item) => item.product.id === productId);
  const nextQuantity = (existing?.quantity || 0) + quantity;

  if (nextQuantity > product.stock) {
    throw new HttpError(409, "Not enough stock for this product");
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  const updated = await getCartInStore(cart.id, storeId);
  return serializeCart(updated);
}

export async function updateCartItem(storeId, cartId, itemId, { quantity }) {
  const cart = await getCartInStore(cartId, storeId);
  if (!cart) {
    throw new HttpError(404, "Cart not found");
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
      cart: { storeId },
    },
    include: {
      product: { select: { stock: true, isActive: true } },
    },
  });

  if (!item) {
    throw new HttpError(404, "Cart item not found");
  }

  if (!item.product.isActive || quantity > item.product.stock) {
    throw new HttpError(409, "Not enough stock for this product");
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  const updated = await getCartInStore(cart.id, storeId);
  return serializeCart(updated);
}

export async function removeCartItem(storeId, cartId, itemId) {
  const cart = await getCartInStore(cartId, storeId);
  if (!cart) {
    throw new HttpError(404, "Cart not found");
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
      cart: { storeId },
    },
    select: { id: true },
  });

  if (!item) {
    throw new HttpError(404, "Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  const updated = await getCartInStore(cart.id, storeId);
  return serializeCart(updated);
}

export async function checkout(storeId, cartId, { name, email }) {
  const cart = await getCartInStore(cartId, storeId);
  if (!cart || cart.items.length === 0) {
    throw new HttpError(400, "Cart is empty");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const order = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: {
        storeId_email: {
          storeId,
          email: normalizedEmail,
        },
      },
      update: { name },
      create: {
        storeId,
        name,
        email: normalizedEmail,
      },
    });

    let total = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await tx.product.findFirst({
        where: { id: item.product.id, storeId, isActive: true },
        select: { id: true, price: true, stock: true, name: true },
      });

      if (!product) {
        throw new HttpError(409, `${item.product.name} is no longer available`);
      }

      if (product.stock < item.quantity) {
        throw new HttpError(409, `Not enough stock for ${product.name}`);
      }

      const unitPrice = money(product.price);
      total += unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: unitPrice,
      });

      const updatedStock = await tx.product.updateMany({
        where: {
          id: product.id,
          storeId,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });

      if (updatedStock.count !== 1) {
        throw new HttpError(409, `Not enough stock for ${product.name}`);
      }
    }

    const created = await tx.order.create({
      data: {
        storeId,
        customerId: customer.id,
        status: "PENDING",
        total,
        items: {
          create: orderItems,
        },
      },
      select: orderSelect,
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.delete({ where: { id: cart.id } });

    return created;
  });

  return serializeOrder(order);
}

export async function listOrders(storeId, query) {
  const pagination = parsePagination(query);
  const where = { storeId };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map(serializeOrder),
    ...paginationMeta({ ...pagination, total }),
  };
}

export async function updateOrderStatus(storeId, orderId, status) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId },
    select: { id: true, status: true },
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: orderSelect,
  });

  return serializeOrder(updated);
}

export async function listPublicOrders(storeId, email, query) {
  const pagination = parsePagination(query);
  const where = {
    storeId,
    customer: { email: email.trim().toLowerCase() },
  };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map(serializeOrder),
    ...paginationMeta({ ...pagination, total }),
  };
}

export async function getPublicOrder(storeId, orderId, email) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      storeId,
      customer: { email: email.trim().toLowerCase() },
    },
    select: orderSelect,
  });

  if (!order) {
    throw new HttpError(404, "Order not found");
  }

  return serializeOrder(order);
}

export async function listCustomers(storeId, query) {
  const pagination = parsePagination(query);
  const where = { storeId };

  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      select: {
        ...customerSelect,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items: items.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      orderCount: customer._count.orders,
    })),
    ...paginationMeta({ ...pagination, total }),
  };
}
