import { Router } from "express";
import { chat, generate, getPublicStatus, getUsage } from "../controllers/ai.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { aiLimiter, publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requirePublicStore, requireStore } from "../middleware/tenant.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { chatSchema, generateSchema } from "../validators/ai.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.get("/public/:slug", publicLimiter, requirePublicStore, getPublicStatus);
router.post("/public/:slug/chat", aiLimiter, requirePublicStore, validate(chatSchema), chat);

router.get("/usage", ...requireMerchantStore, getUsage);
router.post("/generate", aiLimiter, ...requireMerchantStore, validate(generateSchema), generate);

export default router;
