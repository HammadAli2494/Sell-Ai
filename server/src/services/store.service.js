import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { paginationMeta, parsePagination } from "../utils/pagination.js";
import { slugify } from "../utils/slug.js";

const storeSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  settings: {
    select: {
      id: true,
      primaryColor: true,
      currency: true,
      supportEmail: true,
      returnPolicy: true,
      shippingPolicy: true,
      privacyPolicy: true,
      termsPolicy: true,
      logoUrl: true,
    },
  },
};

async function createUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (await prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getStoreForOwner(ownerId) {
  return prisma.store.findFirst({
    where: { ownerId },
    select: storeSelect,
  });
}

function serializePublicStore(store) {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logoUrl: store.settings?.logoUrl || null,
    currency: store.settings?.currency || "USD",
    productCount: store._count?.products || 0,
    categories: (store.categories || []).map((category) => category.name),
    createdAt: store.createdAt,
  };
}

export async function listPublicStores(query = {}) {
  const pagination = parsePagination(query);
  const search = query.search?.trim();
  const where = {
    isActive: true,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        settings: {
          select: {
            logoUrl: true,
            currency: true,
          },
        },
        categories: {
          select: { name: true },
          orderBy: { name: "asc" },
          take: 3,
        },
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    items: items.map(serializePublicStore),
    ...paginationMeta({ ...pagination, total }),
  };
}

export async function listPublicMarketplaceProducts(query = {}) {
  const pagination = parsePagination(query);
  const search = query.search?.trim();
  const where = {
    isActive: true,
    store: { isActive: true },
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
            settings: {
              select: {
                currency: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
    ...paginationMeta({ ...pagination, total }),
  };
}

export async function listPublicMarketplaceCategories() {
  const categories = await prisma.category.findMany({
    where: {
      store: { isActive: true },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      store: {
        select: {
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          products: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 48,
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    storeName: category.store.name,
    storeSlug: category.store.slug,
    productCount: category._count.products,
  }));
}

export async function getPublicStoreBySlug(slug) {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      settings: {
        select: {
          primaryColor: true,
          currency: true,
          supportEmail: true,
          returnPolicy: true,
          shippingPolicy: true,
          privacyPolicy: true,
          termsPolicy: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!store || store.isActive === false) {
    throw new HttpError(404, "Store not found");
  }

  return store;
}

export async function createStore(ownerId, { name, description }) {
  const existing = await prisma.store.findFirst({
    where: { ownerId },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, "You already have a store");
  }

  const slug = await createUniqueSlug(name);
  const freePlan = await prisma.plan.findUnique({
    where: { name: "FREE" },
    select: { id: true },
  });

  if (!freePlan) {
    throw new HttpError(500, "Free plan is not configured");
  }

  try {
    return await prisma.store.create({
      data: {
        ownerId,
        name,
        slug,
        description: description || null,
        isActive: false,
        settings: {
          create: {},
        },
        subscription: {
          create: {
            planId: freePlan.id,
            status: "ACTIVE",
          },
        },
      },
      select: storeSelect,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A store with this name already exists");
    }
    throw error;
  }
}

export async function updateStore(storeId, ownerId, payload) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      ownerId,
    },
    select: { id: true },
  });

  if (!store) {
    throw new HttpError(404, "Store not found");
  }

  const data = {};
  if (payload.name !== undefined) {
    data.name = payload.name;
  }
  if (payload.description !== undefined) {
    data.description = payload.description || null;
  }
  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }
  if (payload.settings) {
    const settings = { ...payload.settings };
    if (settings.currency) {
      settings.currency = settings.currency.toUpperCase();
    }
    for (const key of ["logoUrl", "supportEmail", "returnPolicy", "shippingPolicy", "privacyPolicy", "termsPolicy"]) {
      if (settings[key] === "") {
        settings[key] = null;
      }
    }
    data.settings = {
      update: settings,
    };
  }

  return prisma.store.update({
    where: { id: storeId },
    data,
    select: storeSelect,
  });
}

export async function getPublicPolicies(storeId) {
  const settings = await prisma.storeSettings.findUnique({
    where: { storeId },
    select: {
      returnPolicy: true,
      shippingPolicy: true,
      privacyPolicy: true,
      termsPolicy: true,
      supportEmail: true,
      currency: true,
    },
  });

  return {
    returnPolicy: settings?.returnPolicy || "No return policy has been published.",
    shippingPolicy: settings?.shippingPolicy || "No shipping policy has been published.",
    privacyPolicy: settings?.privacyPolicy || "No privacy policy has been published.",
    termsPolicy: settings?.termsPolicy || "No terms have been published.",
    supportEmail: settings?.supportEmail || null,
    currency: settings?.currency || "USD",
  };
}
