import { z } from "zod";

export const storeSlugQuerySchema = z.object({
  slug: z.string().trim().min(1, "Store slug is required").max(80),
});

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().min(3, "Address is required").max(200),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().min(2, "Country is required").max(80),
});

export const publicOrderQuerySchema = z.object({
  slug: z.string().trim().min(1, "Store slug is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
});

export const publicOrdersQuerySchema = publicOrderQuerySchema.extend({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
