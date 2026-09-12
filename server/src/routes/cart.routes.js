import { Router } from "express";
import { addItem, getCart, removeItem, updateItem } from "../controllers/cart.controller.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { requirePublicStore } from "../middleware/tenant.middleware.js";
import { validate, validateQuery } from "../middleware/validation.middleware.js";
import {
  addCartItemSchema,
  storeSlugQuerySchema,
  updateCartItemSchema,
} from "../validators/order.validator.js";

const router = Router();

router.use(publicLimiter, validateQuery(storeSlugQuerySchema), requirePublicStore);

router.get("/", getCart);
router.post("/items", validate(addCartItemSchema), addItem);
router.patch("/items/:itemId", validate(updateCartItemSchema), updateItem);
router.delete("/items/:itemId", removeItem);

export default router;
