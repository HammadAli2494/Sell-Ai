import { z } from "zod";

export const generateSchema = z
  .object({
    feature: z.enum(["description", "title", "seo", "marketing"]),
    productId: z.string().uuid().optional(),
    productName: z.string().trim().min(2).max(150).optional(),
    category: z.string().trim().max(80).optional(),
    features: z.string().trim().max(1000).optional(),
    audience: z.string().trim().max(200).optional(),
    tone: z.string().trim().max(40).optional(),
  })
  .refine((value) => value.productId || value.productName, {
    message: "Product name or product is required",
  });

export const chatSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(2000),
        }),
      )
      .min(1)
      .max(12),
  })
  .refine((value) => value.messages.at(-1)?.role === "user", {
    message: "The last message must come from the customer",
  });
