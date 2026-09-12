import prisma from "../config/database.js";
import { env } from "../config/env.js";
import { isStripeConfigured, requireStripe, verifyStripeWebhook } from "../config/stripe.js";
import { HttpError } from "../utils/apiResponse.js";

const publicPlanSelect = {
  name: true,
  priceMonthly: true,
  aiRequestLimit: true,
};

const subscriptionSelect = {
  id: true,
  status: true,
  currentPeriodEnd: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  plan: {
    select: {
      ...publicPlanSelect,
      stripePriceId: true,
    },
  },
};

const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

const STRIPE_STATUS_MAP = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  unpaid: "PAST_DUE",
  paused: "PAST_DUE",
};

function money(value) {
  return Number(value || 0);
}

function publicPlan(plan) {
  return {
    name: plan.name,
    priceMonthly: money(plan.priceMonthly),
    aiRequestLimit: plan.aiRequestLimit,
  };
}

async function getFreePlan() {
  const plan = await prisma.plan.findUnique({
    where: { name: "FREE" },
    select: { id: true, ...publicPlanSelect, stripePriceId: true },
  });

  if (!plan) {
    throw new HttpError(500, "Free plan is not configured");
  }

  return plan;
}

function priceIdForPlan(plan) {
  if (plan.stripePriceId) {
    return plan.stripePriceId;
  }

  if (plan.name === "PRO") {
    return env.STRIPE_PRICE_PRO || null;
  }

  if (plan.name === "BUSINESS") {
    return env.STRIPE_PRICE_BUSINESS || null;
  }

  return null;
}

async function getPlanByName(name) {
  const plan = await prisma.plan.findUnique({
    where: { name },
    select: { id: true, ...publicPlanSelect, stripePriceId: true },
  });

  if (!plan) {
    throw new HttpError(404, "Plan not found");
  }

  return plan;
}

async function getPlanByStripePriceId(priceId) {
  if (!priceId) {
    return null;
  }

  const fromDb = await prisma.plan.findFirst({
    where: { stripePriceId: priceId },
    select: { id: true, ...publicPlanSelect, stripePriceId: true },
  });

  if (fromDb) {
    return fromDb;
  }

  if (env.STRIPE_PRICE_PRO && env.STRIPE_PRICE_PRO === priceId) {
    return getPlanByName("PRO");
  }

  if (env.STRIPE_PRICE_BUSINESS && env.STRIPE_PRICE_BUSINESS === priceId) {
    return getPlanByName("BUSINESS");
  }

  return null;
}

function mapStripeStatus(status) {
  return STRIPE_STATUS_MAP[status] || "INCOMPLETE";
}

function periodEndFromStripe(subscription) {
  const unix =
    subscription.current_period_end || subscription.items?.data?.[0]?.current_period_end;

  if (!unix) {
    return null;
  }

  return new Date(unix * 1000);
}

function customerIdFromStripe(subscription) {
  if (!subscription?.customer) {
    return null;
  }

  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

function priceIdFromStripe(subscription) {
  return subscription.items?.data?.[0]?.price?.id || null;
}

async function ensureStoreSubscription(storeId) {
  const existing = await prisma.subscription.findUnique({
    where: { storeId },
    select: subscriptionSelect,
  });

  if (existing) {
    return existing;
  }

  const freePlan = await getFreePlan();

  return prisma.subscription.create({
    data: {
      storeId,
      planId: freePlan.id,
      status: "ACTIVE",
    },
    select: subscriptionSelect,
  });
}

export async function getStoreEntitlements(storeId) {
  const subscription = await ensureStoreSubscription(storeId);
  const entitled = ENTITLED_STATUSES.has(subscription.status);
  const effectivePlan = entitled ? subscription.plan : await getFreePlan();

  return {
    status: subscription.status,
    planName: effectivePlan.name,
    aiRequestLimit: effectivePlan.aiRequestLimit,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}

function toPublicBilling(subscription, entitlements) {
  return {
    configured: isStripeConfigured(),
    hasBillingAccount: Boolean(subscription.stripeCustomerId),
    subscription: {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: publicPlan(subscription.plan),
    },
    entitlements: {
      planName: entitlements.planName,
      aiRequestLimit: entitlements.aiRequestLimit,
    },
  };
}

export async function listPlans() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    select: publicPlanSelect,
  });

  return plans.map(publicPlan);
}

export async function getBilling(storeId) {
  const subscription = await ensureStoreSubscription(storeId);
  const entitlements = await getStoreEntitlements(storeId);
  return toPublicBilling(subscription, entitlements);
}

async function getOrCreateStripeCustomer(storeId, { email, name }) {
  const subscription = await ensureStoreSubscription(storeId);

  if (subscription.stripeCustomerId) {
    return { subscription, customerId: subscription.stripeCustomerId };
  }

  const stripe = requireStripe();
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { storeId },
  });

  const updated = await prisma.subscription.update({
    where: { storeId },
    data: { stripeCustomerId: customer.id },
    select: subscriptionSelect,
  });

  return { subscription: updated, customerId: customer.id };
}

export async function createCheckoutSession(storeId, planName, { email, name }) {
  requireStripe();

  const plan = await getPlanByName(planName);
  const priceId = priceIdForPlan(plan);

  if (!priceId) {
    throw new HttpError(503, "This plan is not available for checkout");
  }

  const current = await ensureStoreSubscription(storeId);

  if (ENTITLED_STATUSES.has(current.status) && current.plan.name === plan.name) {
    throw new HttpError(409, "You are already on this plan");
  }

  const { customerId } = await getOrCreateStripeCustomer(storeId, { email, name });
  const stripe = requireStripe();

  if (current.stripeSubscriptionId && ENTITLED_STATUSES.has(current.status)) {
    const stripeSubscription = await stripe.subscriptions.retrieve(current.stripeSubscriptionId);
    const itemId = stripeSubscription.items.data[0]?.id;

    if (!itemId) {
      throw new HttpError(503, "Could not update the current subscription");
    }

    const updated = await stripe.subscriptions.update(current.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      metadata: { storeId },
      proration_behavior: "create_prorations",
    });

    await applyStripeSubscription(updated, { storeId });
    return { url: null, updated: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: storeId,
    success_url: `${env.CLIENT_URL}/store/billing?checkout=success`,
    cancel_url: `${env.CLIENT_URL}/store/billing?checkout=cancel`,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { storeId },
    subscription_data: {
      metadata: { storeId },
    },
  });

  if (!session.url) {
    throw new HttpError(503, "Could not start checkout");
  }

  return { url: session.url, updated: false };
}

export async function createPortalSession(storeId) {
  requireStripe();

  const subscription = await ensureStoreSubscription(storeId);

  if (!subscription.stripeCustomerId) {
    throw new HttpError(400, "No billing account yet");
  }

  const stripe = requireStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.CLIENT_URL}/store/billing`,
  });

  return { url: session.url };
}

async function applyStripeSubscription(stripeSubscription, { storeId: hintedStoreId } = {}) {
  const stripeSubscriptionId = stripeSubscription.id;
  const stripeCustomerId = customerIdFromStripe(stripeSubscription);
  const metadataStoreId = stripeSubscription.metadata?.storeId || hintedStoreId || null;

  let record = null;

  if (stripeSubscriptionId) {
    record = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId },
      select: { storeId: true },
    });
  }

  if (!record && stripeCustomerId) {
    record = await prisma.subscription.findFirst({
      where: { stripeCustomerId },
      select: { storeId: true },
    });
  }

  const storeId = record?.storeId || metadataStoreId;

  if (!storeId) {
    return null;
  }

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!store) {
    return null;
  }

  await ensureStoreSubscription(storeId);

  const priceId = priceIdFromStripe(stripeSubscription);
  const mappedPlan = await getPlanByStripePriceId(priceId);
  const freePlan = await getFreePlan();
  const status = mapStripeStatus(stripeSubscription.status);

  const data = {
    status,
    currentPeriodEnd: periodEndFromStripe(stripeSubscription),
  };

  if (status === "CANCELED") {
    data.planId = freePlan.id;
  } else if (mappedPlan) {
    data.planId = mappedPlan.id;
  }

  if (stripeCustomerId) {
    data.stripeCustomerId = stripeCustomerId;
  }

  if (stripeSubscriptionId) {
    data.stripeSubscriptionId = stripeSubscriptionId;
  }

  return prisma.subscription.update({
    where: { storeId },
    data,
    select: subscriptionSelect,
  });
}

async function handleCheckoutCompleted(session) {
  if (session.mode && session.mode !== "subscription") {
    return;
  }

  const storeId = session.client_reference_id || session.metadata?.storeId;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const stripe = requireStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applyStripeSubscription(stripeSubscription, { storeId });
}

async function handleInvoiceEvent(invoice) {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id || invoice.parent?.subscription_details?.subscription;

  if (!subscriptionId) {
    return;
  }

  const stripe = requireStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applyStripeSubscription(stripeSubscription);
}

export async function handleStripeWebhook(rawBody, signature) {
  const event = verifyStripeWebhook(rawBody, signature);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applyStripeSubscription(event.data.object);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event.data.object);
      break;
    default:
      break;
  }

  return { received: true };
}
