import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { parseCartId } from "../utils/ids.js";
import * as orderService from "../services/order.service.js";

function cartIdFromRequest(req) {
  return parseCartId(req.headers["x-cart-id"]);
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await orderService.getCart(req.store.id, cartIdFromRequest(req));
  sendSuccess(res, { cart });
});

export const addItem = asyncHandler(async (req, res) => {
  const cart = await orderService.addCartItem(req.store.id, cartIdFromRequest(req), req.body);
  sendSuccess(res, { cart });
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await orderService.updateCartItem(
    req.store.id,
    cartIdFromRequest(req),
    req.params.itemId,
    req.body,
  );
  sendSuccess(res, { cart });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await orderService.removeCartItem(
    req.store.id,
    cartIdFromRequest(req),
    req.params.itemId,
  );
  sendSuccess(res, { cart });
});
