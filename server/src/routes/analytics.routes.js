import { Router } from "express";
import { getMine } from "../controllers/analytics.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireStore } from "../middleware/tenant.middleware.js";
import { validateQuery } from "../middleware/validation.middleware.js";
import { analyticsQuerySchema } from "../validators/analytics.validator.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("MERCHANT", "ADMIN"),
  requireStore,
  validateQuery(analyticsQuerySchema),
  getMine,
);

export default router;
