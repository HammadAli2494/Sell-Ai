import prisma from "../config/database.js";
import { isOpenAIConfigured, requireOpenAI } from "../config/openai.js";
import { HttpError } from "../utils/apiResponse.js";
import { getStoreEntitlements } from "./billing.service.js";
import { getPublicOrder } from "./order.service.js";
import { getProduct, listProducts } from "./product.service.js";
import { getPublicPolicies } from "./store.service.js";

const FEATURE_INSTRUCTIONS = {
  description:
    'Write a professional ecommerce product description. Return JSON: {"description":"..."}.',
  title:
    'Write an optimized ecommerce product title. Return JSON: {"title":"..."}. Keep it under 80 characters.',
  seo: 'Write SEO fields. Return JSON: {"title":"...","metaDescription":"...","slug":"...","altText":"..."}.',
  marketing:
    'Write marketing copy. Return JSON: {"social":"...","adCopy":"...","email":"..."}.',
};

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    return { text: content };
  }
}

function publicUsage({ used, limit, entitlements }) {
  return {
    configured: isOpenAIConfigured(),
    used,
    limit,
    remaining: Math.max(0, limit - used),
    planName: entitlements.planName,
    status: entitlements.status,
    periodStart: startOfUtcMonth().toISOString(),
  };
}

export async function getUsage(storeId) {
  const entitlements = await getStoreEntitlements(storeId);
  const used = await prisma.aIUsage.count({
    where: {
      storeId,
      createdAt: { gte: startOfUtcMonth() },
    },
  });

  return publicUsage({ used, limit: entitlements.aiRequestLimit, entitlements });
}

async function assertWithinLimit(storeId) {
  const usage = await getUsage(storeId);

  if (usage.used >= usage.limit) {
    throw new HttpError(429, "Monthly AI request limit reached");
  }

  return usage;
}

async function resolveInput(storeId, payload) {
  let productName = payload.productName || "";
  let category = payload.category || "";
  let features = payload.features || "";

  if (payload.productId) {
    const product = await getProduct(storeId, payload.productId);
    productName = productName || product.name;
    category = category || product.category?.name || "";
    features = features || product.description || "";
  }

  if (!productName) {
    throw new HttpError(400, "Product name or product is required");
  }

  return {
    productName,
    category,
    features,
    audience: payload.audience || "",
    tone: payload.tone || "professional",
  };
}

function buildUserPrompt(storeName, input) {
  return [
    `Store: ${storeName}`,
    `Product: ${input.productName}`,
    input.category ? `Category: ${input.category}` : null,
    input.features ? `Features: ${input.features}` : null,
    input.audience ? `Audience: ${input.audience}` : null,
    `Tone: ${input.tone}`,
    "Only use the facts provided. Do not invent prices, policies, or stock.",
  ]
    .filter(Boolean)
    .join("\n");
}

function shapeResult(feature, parsed) {
  if (feature === "description") {
    return { description: parsed.description || parsed.text || "" };
  }

  if (feature === "title") {
    return { title: parsed.title || parsed.text || "" };
  }

  if (feature === "seo") {
    return {
      title: parsed.title || "",
      metaDescription: parsed.metaDescription || "",
      slug: parsed.slug || "",
      altText: parsed.altText || "",
    };
  }

  return {
    social: parsed.social || "",
    adCopy: parsed.adCopy || "",
    email: parsed.email || "",
  };
}

export async function generate(storeId, storeName, payload) {
  const input = await resolveInput(storeId, payload);
  await assertWithinLimit(storeId);
  const openai = requireOpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    max_completion_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write ecommerce copy for a merchant dashboard. ${FEATURE_INSTRUCTIONS[payload.feature]}`,
      },
      {
        role: "user",
        content: buildUserPrompt(storeName, input),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const result = shapeResult(payload.feature, parseJsonContent(content));

  await prisma.aIUsage.create({
    data: {
      storeId,
      feature: payload.feature,
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
    },
  });

  const usage = await getUsage(storeId);

  return {
    feature: payload.feature,
    result,
    usage,
  };
}

const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search this store's active products by name or description.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Get one active product from this store by product id.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          productId: { type: "string" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_store_policies",
      description: "Get this store's return policy, shipping policy, and support email.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_order",
      description:
        "Look up an order in this store. Requires the customer email used at checkout.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          orderId: { type: "string" },
          email: { type: "string" },
        },
        required: ["orderId", "email"],
      },
    },
  },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseToolArgs(raw) {
  if (!raw) {
    return {};
  }
  if (typeof raw === "object") {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function publicProductCard(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    stock: product.stock,
    description: product.description,
    category: product.category?.name || null,
  };
}

async function runChatTool(storeId, name, rawArgs) {
  const args = parseToolArgs(rawArgs);

  if (name === "search_products") {
    const query = String(args.query || "").trim().slice(0, 80);
    const result = await listProducts(
      storeId,
      { search: query || undefined, limit: 5 },
      { activeOnly: true },
    );
    return {
      products: result.items.map(publicProductCard),
    };
  }

  if (name === "get_product") {
    const productId = String(args.productId || "");
    if (!UUID_PATTERN.test(productId)) {
      return { found: false };
    }
    try {
      const product = await getProduct(storeId, productId, { activeOnly: true });
      return { found: true, product: publicProductCard(product) };
    } catch (error) {
      if (error.statusCode === 404) {
        return { found: false };
      }
      throw error;
    }
  }

  if (name === "get_store_policies") {
    return getPublicPolicies(storeId);
  }

  if (name === "lookup_order") {
    const orderId = String(args.orderId || "");
    const email = String(args.email || "").trim();
    if (!UUID_PATTERN.test(orderId) || !email) {
      return { found: false };
    }
    try {
      const order = await getPublicOrder(storeId, orderId, email);
      return {
        found: true,
        order: {
          id: order.id,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          customerName: order.customer?.name || null,
          items: (order.items || []).map((item) => ({
            name: item.product?.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return { found: false };
      }
      throw error;
    }
  }

  return { error: "Unknown tool" };
}

export async function getPublicChatStatus(storeId) {
  const usage = await getUsage(storeId);
  return {
    available: usage.configured && usage.remaining > 0,
  };
}

export async function chat(storeId, storeName, payload) {
  const history = payload.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  await assertWithinLimit(storeId);
  const openai = requireOpenAI();

  const messages = [
    {
      role: "system",
      content: [
        `You are the customer assistant for ${storeName} only.`,
        "Use tools to look up products, store policies, and orders.",
        "Never invent prices, stock, policies, or order status.",
        "Never access or discuss another store.",
        "For orders, you must have the customer email used at checkout.",
        "Do not ask for passwords or payment card numbers.",
        "If a tool does not find something, say so.",
      ].join(" "),
    },
    ...history,
  ];

  let inputTokens = 0;
  let outputTokens = 0;
  let reply = "";

  for (let round = 0; round < 4; round += 1) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_completion_tokens: 500,
      messages,
      tools: CHAT_TOOLS,
      tool_choice: "auto",
    });

    inputTokens += completion.usage?.prompt_tokens || 0;
    outputTokens += completion.usage?.completion_tokens || 0;

    const message = completion.choices[0]?.message;
    if (!message) {
      break;
    }

    if (!message.tool_calls?.length) {
      reply = message.content || "";
      break;
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      const output = await runChatTool(storeId, toolCall.function?.name, toolCall.function?.arguments);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(output),
      });
    }
  }

  await prisma.aIUsage.create({
    data: {
      storeId,
      feature: "chat",
      inputTokens,
      outputTokens,
    },
  });

  return {
    reply: reply || "I could not complete that request.",
  };
}
