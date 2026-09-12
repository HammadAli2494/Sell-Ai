import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as storeService from "../services/store.service.js";

export const create = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.user.id, req.body);
  sendSuccess(res, { store }, 201);
});

export const getMine = asyncHandler(async (req, res) => {
  const store = await storeService.getStoreForOwner(req.user.id);
  sendSuccess(res, { store });
});

export const getBySlug = asyncHandler(async (req, res) => {
  const store = await storeService.getPublicStoreBySlug(req.params.slug);
  sendSuccess(res, { store });
});

export const updateMine = asyncHandler(async (req, res) => {
  const store = await storeService.updateStore(req.store.id, req.user.id, req.body);
  sendSuccess(res, { store });
});
