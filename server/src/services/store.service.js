import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { slugify } from "../utils/slug.js";

const storeSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
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

export async function getPublicStoreBySlug(slug) {
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      settings: {
        select: {
          primaryColor: true,
          currency: true,
          supportEmail: true,
          returnPolicy: true,
          shippingPolicy: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!store) {
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
  if (payload.settings) {
    const settings = { ...payload.settings };
    if (settings.currency) {
      settings.currency = settings.currency.toUpperCase();
    }
    for (const key of ["logoUrl", "supportEmail", "returnPolicy", "shippingPolicy"]) {
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
      supportEmail: true,
      currency: true,
    },
  });

  return {
    returnPolicy: settings?.returnPolicy || "No return policy has been published.",
    shippingPolicy: settings?.shippingPolicy || "No shipping policy has been published.",
    supportEmail: settings?.supportEmail || null,
    currency: settings?.currency || "USD",
  };
}
