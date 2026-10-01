import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().max(80).optional(),
});

export const productQuerySchema = paginationQuerySchema.extend({
  categoryId: z.string().uuid().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(80),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(80),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters").max(150),
  description: z.string().trim().max(2000).optional(),
  price: z.number().positive("Price must be greater than 0"),
  stock: z.number().int().min(0),
  imageUrl: z.string().trim().url("Enter a valid image URL").max(500).optional().or(z.literal("")),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();
