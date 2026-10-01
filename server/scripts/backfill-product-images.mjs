import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FALLBACKS = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
];

const BY_SLUG = {
  "silk-midi-dress": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
  "canvas-tote": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  "canvas-tote-1788942555264": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
};

async function main() {
  const missing = await prisma.product.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  for (const [index, product] of missing.entries()) {
    const imageUrl = BY_SLUG[product.slug] || FALLBACKS[index % FALLBACKS.length];
    await prisma.product.update({
      where: { id: product.id },
      data: { imageUrl },
    });
    console.log(`Updated ${product.name}`);
  }

  console.log(`Backfilled ${missing.length} products`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
