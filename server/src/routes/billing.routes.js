import { Router } from "express";
import { checkout, getMine, listPlans, portal } from "../controllers/billing.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { billingLimiter } from "../middleware/rateLimit.middleware.js";
import { requireStore } from "../middleware/tenant.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { checkoutSchema } from "../validators/billing.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.get("/plans", ...requireMerchantStore, listPlans);
router.get("/", ...requireMerchantStore, getMine);
router.post("/checkout", billingLimiter, ...requireMerchantStore, validate(checkoutSchema), checkout);
router.post("/portal", billingLimiter, ...requireMerchantStore, portal);

export default router;
