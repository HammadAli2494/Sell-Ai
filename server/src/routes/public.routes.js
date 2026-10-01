import { Router } from "express";
import { getStore, listCategories, listProducts, listStores } from "../controllers/public.controller.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import { validateQuery } from "../middleware/validation.middleware.js";
import { paginationQuerySchema } from "../validators/product.validator.js";
import { publicStoreQuerySchema } from "../validators/store.validator.js";

const router = Router();

router.get("/stores", publicLimiter, validateQuery(publicStoreQuerySchema), listStores);
router.get("/stores/:slug", publicLimiter, getStore);
router.get("/products", publicLimiter, validateQuery(paginationQuerySchema), listProducts);
router.get("/categories", publicLimiter, listCategories);

export default router;
