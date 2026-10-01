import { z } from "zod";

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, "Store name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
});

export const publicStoreQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().max(80).optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().trim().min(2, "Store name must be at least 2 characters").max(80).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  settings: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex value like #2563eb")
        .optional(),
      currency: z.string().trim().length(3, "Currency must be a 3-letter code").optional(),
      supportEmail: z
        .string()
        .trim()
        .email("Enter a valid support email")
        .max(255)
        .optional()
        .or(z.literal("")),
      logoUrl: z.string().trim().url("Enter a valid image URL").max(500).optional().or(z.literal("")),
      returnPolicy: z.string().trim().max(2000).optional(),
      shippingPolicy: z.string().trim().max(2000).optional(),
      privacyPolicy: z.string().trim().max(4000).optional(),
      termsPolicy: z.string().trim().max(4000).optional(),
    })
    .optional(),
});
