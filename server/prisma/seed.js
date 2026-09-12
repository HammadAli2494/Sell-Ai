import { PrismaClient } from "@prisma/client";

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
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
