import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as orderService from "../services/order.service.js";

export const list = asyncHandler(async (req, res) => {
  const result = await orderService.listCustomers(req.store.id, req.validatedQuery || req.query);
  sendSuccess(res, result);
});
