import { Router } from "express";
import { create, list, listPublic, getPublicOne, remove, update } from "../controllers/product.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requirePublicStore, requireStore } from "../middleware/tenant.middleware.js";
import { validate, validateQuery } from "../middleware/validation.middleware.js";
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "../validators/product.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.get(
  "/public/:slug",
  publicLimiter,
  requirePublicStore,
  validateQuery(productQuerySchema),
  listPublic,
);
router.get("/public/:slug/:id", publicLimiter, requirePublicStore, getPublicOne);

router.get("/", ...requireMerchantStore, validateQuery(productQuerySchema), list);
router.post("/", ...requireMerchantStore, validate(createProductSchema), create);
router.put("/:id", ...requireMerchantStore, validate(updateProductSchema), update);
router.delete("/:id", ...requireMerchantStore, remove);

export default router;
