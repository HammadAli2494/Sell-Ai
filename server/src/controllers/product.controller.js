import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as productService from "../services/product.service.js";

export const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.store.id, req.validatedQuery || req.query);
  sendSuccess(res, result);
});

export const listPublic = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.store.id, req.validatedQuery || req.query, {
    activeOnly: true,
  });
  sendSuccess(res, result);
});

export const getPublicOne = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.store.id, req.params.id, {
    activeOnly: true,
  });
  sendSuccess(res, { product });
});

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.store.id, req.body);
  sendSuccess(res, { product }, 201);
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.store.id, req.params.id, req.body);
  sendSuccess(res, { product });
});

export const remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.store.id, req.params.id);
  sendSuccess(res, { message: "Product deleted" });
});
