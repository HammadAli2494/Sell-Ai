import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as billingService from "../services/billing.service.js";

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await billingService.listPlans();
  sendSuccess(res, { plans });
});

export const getMine = asyncHandler(async (req, res) => {
  const billing = await billingService.getBilling(req.store.id);
  sendSuccess(res, { billing });
});

export const checkout = asyncHandler(async (req, res) => {
  const result = await billingService.createCheckoutSession(req.store.id, req.body.plan, {
    email: req.user.email,
    name: req.user.name,
  });
  sendSuccess(res, result);
});

export const portal = asyncHandler(async (req, res) => {
  const result = await billingService.createPortalSession(req.store.id);
  sendSuccess(res, result);
});

export const webhook = asyncHandler(async (req, res) => {
  const result = await billingService.handleStripeWebhook(
    req.body,
    req.headers["stripe-signature"],
  );
  sendSuccess(res, result);
});
