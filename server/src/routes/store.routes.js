import { Router } from "express";
import { create, getBySlug, getMine, updateMine } from "../controllers/store.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requireStore } from "../middleware/tenant.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { createStoreSchema, updateStoreSchema } from "../validators/store.validator.js";

const router = Router();
const requireMerchant = [requireAuth, requireRole("MERCHANT", "ADMIN")];

router.get("/slug/:slug", publicLimiter, getBySlug);
router.post("/", ...requireMerchant, validate(createStoreSchema), create);
router.get("/me", ...requireMerchant, getMine);
router.patch("/me", ...requireMerchant, requireStore, validate(updateStoreSchema), updateMine);

export default router;
