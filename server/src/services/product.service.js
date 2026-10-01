import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { paginationMeta, parsePagination } from "../utils/pagination.js";
import { slugify } from "../utils/slug.js";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  isActive: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
};

function toNumber(value) {
  return Number(value);
}

function serializeProduct(product) {
  if (!product) {
    return product;
  }

  return {
    ...product,
    price: toNumber(product.price),
  };
}

async function uniqueStoreSlug(model, storeId, name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma[model].findFirst({
      where: {
        storeId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function assertCategoryInStore(storeId, categoryId) {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });

  if (!category) {
    throw new HttpError(400, "Category not found in this store");
  }
}

export async function listCategories(storeId) {
  return prisma.category.findMany({
    where: { storeId },
    select: categorySelect,
    orderBy: { name: "asc" },
  });
}

export async function createCategory(storeId, { name }) {
  const slug = await uniqueStoreSlug("category", storeId, name);

  try {
    return await prisma.category.create({
      data: { storeId, name, slug },
      select: categorySelect,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A category with this name already exists");
    }
    throw error;
  }
}

export async function updateCategory(storeId, categoryId, { name }) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });

  if (!category) {
    throw new HttpError(404, "Category not found");
  }

  const slug = await uniqueStoreSlug("category", storeId, name, categoryId);

  return prisma.category.update({
    where: { id: categoryId },
    data: { name, slug },
    select: categorySelect,
  });
}

export async function deleteCategory(storeId, categoryId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
    select: { id: true },
  });

  if (!category) {
    throw new HttpError(404, "Category not found");
  }

  await prisma.category.delete({ where: { id: categoryId } });
}

export async function listProducts(storeId, query, { activeOnly = false } = {}) {
  const pagination = parsePagination(query);
  const where = {
    storeId,
    ...(activeOnly ? { isActive: true } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy =
    query.sort === "price_asc"
      ? { price: "asc" }
      : query.sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeProduct),
    ...paginationMeta({ ...pagination, total }),
  };
}

export async function getProduct(storeId, productId, { activeOnly = false } = {}) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    select: productSelect,
  });

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  return serializeProduct(product);
}

export async function createProduct(storeId, payload) {
  await assertCategoryInStore(storeId, payload.categoryId);
  const slug = await uniqueStoreSlug("product", storeId, payload.name);

  try {
    const product = await prisma.product.create({
      data: {
        storeId,
        name: payload.name,
        slug,
        description: payload.description || null,
        price: payload.price,
        stock: payload.stock,
        imageUrl: payload.imageUrl || null,
        categoryId: payload.categoryId || null,
        isActive: payload.isActive ?? true,
      },
      select: productSelect,
    });

    return serializeProduct(product);
  } catch (error) {
    if (error.code === "P2002") {
      throw new HttpError(409, "A product with this name already exists");
    }
    throw error;
  }
}

export async function updateProduct(storeId, productId, payload) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  if (payload.categoryId !== undefined) {
    await assertCategoryInStore(storeId, payload.categoryId);
  }

  const data = {};
  if (payload.name !== undefined) {
    data.name = payload.name;
    data.slug = await uniqueStoreSlug("product", storeId, payload.name, productId);
  }
  if (payload.description !== undefined) {
    data.description = payload.description || null;
  }
  if (payload.price !== undefined) {
    data.price = payload.price;
  }
  if (payload.stock !== undefined) {
    data.stock = payload.stock;
  }
  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl || null;
  }
  if (payload.categoryId !== undefined) {
    data.categoryId = payload.categoryId || null;
  }
  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data,
    select: productSelect,
  });

  return serializeProduct(updated);
}

export async function deleteProduct(storeId, productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
    select: { id: true },
  });

  if (!product) {
    throw new HttpError(404, "Product not found");
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (error) {
    if (error.code === "P2003") {
      throw new HttpError(409, "This product is used in existing orders");
    }
    throw error;
  }
}
