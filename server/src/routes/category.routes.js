import { Router } from "express";
import { create, list, remove, update } from "../controllers/category.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requirePublicStore, requireStore } from "../middleware/tenant.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../validators/product.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.get("/public/:slug", publicLimiter, requirePublicStore, list);

router.get("/", ...requireMerchantStore, list);
router.post("/", ...requireMerchantStore, validate(createCategorySchema), create);
router.put("/:id", ...requireMerchantStore, validate(updateCategorySchema), update);
router.delete("/:id", ...requireMerchantStore, remove);

export default router;
