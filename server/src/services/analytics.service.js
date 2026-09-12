import prisma from "../config/database.js";

const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

function money(value) {
  return Number(value || 0);
}

function utcDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function startOfUtcDay(daysAgo) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (daysAgo - 1));
  return date;
}

function buildDailySeries(orders, since, days) {
  const buckets = new Map();
  const start = new Date(since.getTime());

  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const key = utcDateKey(day);
    buckets.set(key, { date: key, sales: 0, orders: 0 });
  }

  for (const order of orders) {
    if (order.status === "CANCELLED") {
      continue;
    }

    const bucket = buckets.get(utcDateKey(order.createdAt));
    if (!bucket) {
      continue;
    }

    bucket.sales += money(order.total);
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

export async function getStoreAnalytics(storeId, { days = 30 } = {}) {
  const since = startOfUtcDay(days);

  const [
    salesAgg,
    paidAgg,
    pendingAgg,
    cancelledCount,
    statusGroups,
    customerCount,
    productCount,
    activeProductCount,
    lowStockProducts,
    recentOrders,
    periodOrders,
    topProductGroups,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { storeId, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { storeId, status: { in: PAID_STATUSES } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { storeId, status: "PENDING" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({
      where: { storeId, status: "CANCELLED" },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { storeId },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.customer.count({ where: { storeId } }),
    prisma.product.count({ where: { storeId } }),
    prisma.product.count({ where: { storeId, isActive: true } }),
    prisma.product.findMany({
      where: { storeId, stock: { lte: 5 } },
      select: {
        id: true,
        name: true,
        stock: true,
        isActive: true,
      },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: {
        storeId,
        createdAt: { gte: since },
      },
      select: {
        createdAt: true,
        total: true,
        status: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          storeId,
          status: { not: "CANCELLED" },
        },
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const productIds = topProductGroups.map((group) => group.productId);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: productIds },
          storeId,
        },
        select: {
          id: true,
          name: true,
        },
      })
    : [];
  const productNames = new Map(products.map((product) => [product.id, product.name]));

  return {
    days,
    totals: {
      sales: money(salesAgg._sum.total),
      salesCount: salesAgg._count,
      paid: money(paidAgg._sum.total),
      paidCount: paidAgg._count,
      pending: money(pendingAgg._sum.total),
      pendingCount: pendingAgg._count,
      cancelledCount,
      customers: customerCount,
      products: productCount,
      activeProducts: activeProductCount,
    },
    ordersByStatus: ORDER_STATUSES.map((status) => {
      const row = statusGroups.find((group) => group.status === status);
      return {
        status,
        count: row?._count?._all || 0,
        total: money(row?._sum?.total),
      };
    }),
    salesByDay: buildDailySeries(periodOrders, since, days),
    topProducts: topProductGroups.map((group) => ({
      productId: group.productId,
      name: productNames.get(group.productId) || "Unknown product",
      quantity: group._sum.quantity || 0,
    })),
    lowStockProducts,
    recentOrders: recentOrders.map((order) => ({
      ...order,
      total: money(order.total),
    })),
  };
}
