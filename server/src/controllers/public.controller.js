import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as storeService from "../services/store.service.js";

export const listStores = asyncHandler(async (req, res) => {
  const result = await storeService.listPublicStores(req.validatedQuery || req.query);
  sendSuccess(res, result);
});

export const getStore = asyncHandler(async (req, res) => {
  const store = await storeService.getPublicStoreBySlug(req.params.slug);
  sendSuccess(res, { store });
});

export const listProducts = asyncHandler(async (req, res) => {
  const result = await storeService.listPublicMarketplaceProducts(req.validatedQuery || req.query);
  sendSuccess(res, result);
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await storeService.listPublicMarketplaceCategories();
  sendSuccess(res, { categories });
});
