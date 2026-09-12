import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as productService from "../services/product.service.js";

export const list = asyncHandler(async (req, res) => {
  const categories = await productService.listCategories(req.store.id);
  sendSuccess(res, { categories });
});

export const create = asyncHandler(async (req, res) => {
  const category = await productService.createCategory(req.store.id, req.body);
  sendSuccess(res, { category }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const category = await productService.updateCategory(req.store.id, req.params.id, req.body);
  sendSuccess(res, { category });
});

export const remove = asyncHandler(async (req, res) => {
  await productService.deleteCategory(req.store.id, req.params.id);
  sendSuccess(res, { message: "Category deleted" });
});
