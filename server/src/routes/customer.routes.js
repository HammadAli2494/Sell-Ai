import { Router } from "express";
import { list } from "../controllers/customer.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { requireStore } from "../middleware/tenant.middleware.js";
import { validateQuery } from "../middleware/validation.middleware.js";
import { paginationQuerySchema } from "../validators/product.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.get("/", ...requireMerchantStore, validateQuery(paginationQuerySchema), list);

export default router;
