import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { parseCartId } from "../utils/ids.js";
import * as orderService from "../services/order.service.js";

export const checkout = asyncHandler(async (req, res) => {
  const cartId = parseCartId(req.headers["x-cart-id"]);
  const order = await orderService.checkout(req.store.id, cartId, req.user, req.body);
  sendSuccess(res, { order }, 201);
});

export const listMine = asyncHandler(async (req, res) => {
  const result = await orderService.listMyOrders(req.user.id, req.validatedQuery || req.query);
  sendSuccess(res, result);
});

export const getMine = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrder(req.user.id, req.params.id);
  sendSuccess(res, { order });
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getMerchantOrder(req.store.id, req.params.id);
  sendSuccess(res, { order });
});

export const list = asyncHandler(async (req, res) => {
  const result = await orderService.listOrders(req.store.id, req.validatedQuery || req.query);
  sendSuccess(res, result);
});

export const listPublic = asyncHandler(async (req, res) => {
  const email = req.validatedQuery?.email || req.query.email;
  const result = await orderService.listPublicOrders(req.store.id, email, req.validatedQuery);
  sendSuccess(res, result);
});

export const getPublicOne = asyncHandler(async (req, res) => {
  const email = req.validatedQuery?.email || req.query.email;
  const order = await orderService.getPublicOrder(req.store.id, req.params.id, email);
  sendSuccess(res, { order });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.store.id, req.params.id, req.body.status);
  sendSuccess(res, { order });
});
