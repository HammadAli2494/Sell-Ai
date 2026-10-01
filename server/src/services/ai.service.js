import { Type } from "@google/genai";
import { getGeminiModel, isGeminiConfigured, logGeminiError, requireGemini, withGeminiRetry } from "../config/gemini.js";
import prisma from "../config/database.js";
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

function mapAiProviderError(error, context) {
  if (error instanceof HttpError) {
    throw error;
  }

  const details = logGeminiError(context, error, { model: getGeminiModel() });
  const status = Number(details.status || details.statusCode);
  const message = String(details.message || "");

  if (status === 401 || status === 403 || /api key|invalid.?key|permission denied|unauthenticated|unregistered callers/i.test(message)) {
    throw new HttpError(503, "AI is not configured correctly. Check GEMINI_API_KEY on the server.");
  }

  if (status === 429 || /resource.?exhausted|quota|rate limit|too many requests/i.test(message)) {
    if (/quota|free.?tier|exceeded/i.test(message)) {
      throw new HttpError(429, "The Gemini free-tier quota is exhausted. Please try again later.");
    }
    throw new HttpError(429, "AI is temporarily unavailable. Please try again later.");
  }

  if (status === 404 || (/not found|model/i.test(message) && /not found|unsupported|does not exist/i.test(message))) {
    throw new HttpError(503, "The configured Gemini model is not available.");
  }

  if (error.geminiRetriesExhausted || status === 503 || /unavailable|high demand|try again later/i.test(message)) {
    throw new HttpError(503, "AI service is temporarily busy. Please try again shortly.");
  }

  if (/fetch failed|ECONNRESET|ENOTFOUND|ETIMEDOUT|network|socket|ECONNREFUSED/i.test(message)) {
    throw new HttpError(503, "AI service is temporarily busy. Please try again shortly.");
  }

  if (/invalid.*json|empty response|no candidates|blocked|finishreason/i.test(message)) {
    throw new HttpError(502, "The AI service returned an invalid response.");
  }

  throw new HttpError(503, "The Gemini request failed. Check the server logs for details.");
}

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
    configured: isGeminiConfigured(),
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

function usageFromGemini(response) {
  return {
    inputTokens: response?.usageMetadata?.promptTokenCount || 0,
    outputTokens: response?.usageMetadata?.candidatesTokenCount || 0,
  };
}

function textFromGemini(response) {
  const text = response?.text;
  if (typeof text === "string" && text.trim()) {
    return text;
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("").trim();
}

export async function generate(storeId, storeName, payload) {
  const input = await resolveInput(storeId, payload);
  await assertWithinLimit(storeId);
  const gemini = requireGemini();

  let response;
  try {
    response = await withGeminiRetry(
      () => gemini.models.generateContent({
        model: getGeminiModel(),
        contents: buildUserPrompt(storeName, input),
        config: {
          systemInstruction: `You write ecommerce copy for a merchant dashboard. ${FEATURE_INSTRUCTIONS[payload.feature]}`,
          temperature: 0.6,
          maxOutputTokens: 700,
          responseMimeType: "application/json",
        },
      }),
      "generate",
    );
  } catch (error) {
    mapAiProviderError(error, "generate");
  }

  const content = textFromGemini(response);
  if (!content) {
    logGeminiError("generate", new Error("Gemini returned an empty response"), {
      model: getGeminiModel(),
    });
    throw new HttpError(502, "The AI service returned an invalid response.");
  }

  const result = shapeResult(payload.feature, parseJsonContent(content));
  const tokens = usageFromGemini(response);

  await prisma.aIUsage.create({
    data: {
      storeId,
      feature: payload.feature,
      inputTokens: tokens.inputTokens,
      outputTokens: tokens.outputTokens,
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
    functionDeclarations: [
      {
        name: "search_products",
        description: "Search this store's active products by name or description.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
          },
        },
      },
      {
        name: "get_product",
        description: "Get one active product from this store by product id.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
          },
          required: ["productId"],
        },
      },
      {
        name: "get_store_policies",
        description: "Get this store's return policy, shipping policy, and support email.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "lookup_order",
        description: "Look up an order in this store. Requires the customer email used at checkout.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            orderId: { type: Type.STRING },
            email: { type: Type.STRING },
          },
          required: ["orderId", "email"],
        },
      },
    ],
  },
];

function historyToGeminiContents(history) {
  return history.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

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
  await assertWithinLimit(storeId);
  const gemini = requireGemini();
  const contents = historyToGeminiContents(payload.messages);
  const systemInstruction = [
    `You are the customer assistant for ${storeName} only.`,
    "Use tools to look up products, store policies, and orders.",
    "Never invent prices, stock, policies, or order status.",
    "Never access or discuss another store.",
    "For orders, you must have the customer email used at checkout.",
    "Do not ask for passwords or payment card numbers.",
    "If a tool does not find something, say so.",
  ].join(" ");

  let inputTokens = 0;
  let outputTokens = 0;
  let reply = "";

  for (let round = 0; round < 4; round += 1) {
    let response;
    try {
      response = await withGeminiRetry(
        () => gemini.models.generateContent({
          model: getGeminiModel(),
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
            maxOutputTokens: 500,
            tools: CHAT_TOOLS,
            automaticFunctionCalling: { disable: true },
          },
        }),
        "chat",
      );
    } catch (error) {
      mapAiProviderError(error, "chat");
    }

    const tokens = usageFromGemini(response);
    inputTokens += tokens.inputTokens;
    outputTokens += tokens.outputTokens;

    const functionCalls = response?.functionCalls || [];
    if (!functionCalls.length) {
      reply = textFromGemini(response);
      break;
    }

    const modelContent = response?.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    }

    for (const toolCall of functionCalls) {
      const output = await runChatTool(storeId, toolCall.name, toolCall.args);
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: toolCall.name,
              id: toolCall.id,
              response: output,
            },
          },
        ],
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
