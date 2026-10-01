import { Router } from "express";
import {
  checkout,
  getMine,
  getOne,
  getPublicOne,
  list,
  listMine,
  listPublic,
  updateStatus,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { checkoutLimiter, publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requirePublicStore, requireStore } from "../middleware/tenant.middleware.js";
import { validate, validateQuery } from "../middleware/validation.middleware.js";
import {
  checkoutSchema,
  orderQuerySchema,
  publicOrderQuerySchema,
  publicOrdersQuerySchema,
  storeSlugQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";

const router = Router();
const requireMerchantStore = [requireAuth, requireRole("MERCHANT", "ADMIN"), requireStore];

router.post(
  "/checkout",
  checkoutLimiter,
  requireAuth,
  requireRole("CUSTOMER"),
  validateQuery(storeSlugQuerySchema),
  requirePublicStore,
  validate(checkoutSchema),
  checkout,
);
router.get("/me", requireAuth, requireRole("CUSTOMER"), validateQuery(orderQuerySchema), listMine);
router.get("/me/:id", requireAuth, requireRole("CUSTOMER"), getMine);
router.get(
  "/public",
  publicLimiter,
  validateQuery(publicOrdersQuerySchema),
  requirePublicStore,
  listPublic,
);
router.get(
  "/public/:id",
  publicLimiter,
  validateQuery(publicOrderQuerySchema),
  requirePublicStore,
  getPublicOne,
);

router.get("/", ...requireMerchantStore, validateQuery(orderQuerySchema), list);
router.get("/:id", ...requireMerchantStore, getOne);
router.patch("/:id", ...requireMerchantStore, validate(updateOrderStatusSchema), updateStatus);

export default router;
