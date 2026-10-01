import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const plans = [
  {
    name: "FREE",
    priceMonthly: 0,
    aiRequestLimit: 100,
  },
  {
    name: "PRO",
    priceMonthly: 29,
    aiRequestLimit: 5000,
  },
  {
    name: "BUSINESS",
    priceMonthly: 99,
    aiRequestLimit: 20000,
  },
];

async function seed() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        priceMonthly: plan.priceMonthly,
        aiRequestLimit: plan.aiRequestLimit,
      },
      create: plan,
    });
  }

  console.log("Seeded subscription plans");

  const freePlan = await prisma.plan.findUnique({
    where: { name: "FREE" },
    select: { id: true },
  });

  const passwordHash = await hashPassword("password12");

  const merchant = await prisma.user.upsert({
    where: { email: "ada.merchant@example.com" },
    update: {},
    create: {
      email: "ada.merchant@example.com",
      name: "Ada Merchant",
      role: "MERCHANT",
      passwordHash,
    },
  });

  let store = await prisma.store.findFirst({
    where: {
      OR: [{ slug: "ada-boutique" }, { ownerId: merchant.id }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerId: merchant.id,
        name: "Ada Boutique",
        slug: "ada-boutique",
        description: "A demo clothing store for recruiters to browse.",
        isActive: true,
        settings: {
          create: {
            primaryColor: "#4f46e5",
            currency: "USD",
            supportEmail: "hello@ada-boutique.example",
            shippingPolicy: "Orders ship within 2-3 business days.",
            returnPolicy: "Returns accepted within 30 days of delivery.",
            privacyPolicy: "We only use your details to fulfill orders.",
            termsPolicy: "Demo store terms for portfolio walkthroughs.",
          },
        },
        subscription: freePlan
          ? {
              create: {
                planId: freePlan.id,
                status: "ACTIVE",
              },
            }
          : undefined,
      },
    });
  }

  const category = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: "dresses",
      },
    },
    update: {},
    create: {
      storeId: store.id,
      name: "Dresses",
      slug: "dresses",
    },
  });

  await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: store.id,
        slug: "silk-midi-dress",
      },
    },
    update: {
      imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    },
    create: {
      storeId: store.id,
      categoryId: category.id,
      name: "Silk Midi Dress",
      slug: "silk-midi-dress",
      description: "A lightweight midi dress for everyday wear.",
      price: 89,
      stock: 25,
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.customer@example.com" },
    update: {},
    create: {
      email: "demo.customer@example.com",
      name: "Demo Customer",
      role: "CUSTOMER",
      passwordHash,
      country: "United States",
    },
  });

  const merchantB = await prisma.user.upsert({
    where: { email: "phase5.merchant.b@example.com" },
    update: {},
    create: {
      email: "phase5.merchant.b@example.com",
      name: "Beta Merchant",
      role: "MERCHANT",
      passwordHash,
    },
  });

  let storeB = await prisma.store.findFirst({
    where: {
      OR: [{ slug: "beta-shop" }, { ownerId: merchantB.id }],
    },
  });

  if (!storeB) {
    storeB = await prisma.store.create({
      data: {
        ownerId: merchantB.id,
        name: "Beta Shop",
        slug: "beta-shop",
        description: "Second demo store used to prove tenant isolation.",
        settings: {
          create: {
            primaryColor: "#2563eb",
            currency: "USD",
            supportEmail: "hello@beta-shop.example",
          },
        },
        subscription: freePlan
          ? {
              create: {
                planId: freePlan.id,
                status: "ACTIVE",
              },
            }
          : undefined,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: "customer.b@example.com" },
    update: {},
    create: {
      email: "customer.b@example.com",
      name: "Customer B",
      role: "CUSTOMER",
      passwordHash,
      country: "United States",
    },
  });

  console.log("Seeded demo merchant ada.merchant@example.com / password12");
  console.log("Seeded demo store /s/ada-boutique");
  console.log("Seeded isolation merchant phase5.merchant.b@example.com / password12");
  console.log("Seeded demo customer demo.customer@example.com / password12");
  console.log("Seeded isolation customer customer.b@example.com / password12");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
