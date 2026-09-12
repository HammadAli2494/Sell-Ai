import Stripe from "stripe";
import { env } from "./env.js";
import { HttpError } from "../utils/apiResponse.js";

let stripeClient;

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function requireStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, "Billing is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function verifyStripeWebhook(rawBody, signature) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new HttpError(503, "Billing webhook is not configured");
  }

  if (!signature) {
    throw new HttpError(400, "Invalid webhook signature");
  }

  try {
    const stripe = env.STRIPE_SECRET_KEY ? requireStripe() : new Stripe("sk_test_webhook_only");
    return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(400, "Invalid webhook signature");
  }
}
