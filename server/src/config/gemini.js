import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";
import { HttpError } from "../utils/apiResponse.js";

let client;

const SECRET_KEY_PATTERN = /api[_-]?key|authorization|bearer|token|secret|password|credential/i;
const SECRET_VALUE_PATTERN = /(AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{10,})/g;

export function isGeminiConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}

export function getGeminiModel() {
  return env.GEMINI_MODEL;
}

export function requireGemini() {
  if (!env.GEMINI_API_KEY) {
    throw new HttpError(503, "AI is not configured");
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  return client;
}

function redactSecrets(value) {
  if (typeof value === "string") {
    return value.replace(SECRET_VALUE_PATTERN, "[REDACTED]");
  }
  return value;
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sanitizeForLog(value, seen = new WeakSet()) {
  if (value == null) {
    return value;
  }

  if (typeof value === "string") {
    return redactSecrets(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return sanitizeForLog({
      name: value.name,
      message: value.message,
      status: value.status,
      statusCode: value.statusCode,
      code: value.code,
      error: value.error,
      cause: value.cause,
    }, seen);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeForLog(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    const output = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        output[key] = "[REDACTED]";
        continue;
      }
      output[key] = sanitizeForLog(nested, seen);
    }
    return output;
  }

  return String(value);
}

function pickProviderBody(error) {
  const candidates = [
    error?.error,
    error?.response,
    error?.cause?.error,
    error?.cause,
    safeJson(error?.message),
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object") {
      return sanitizeForLog(candidate);
    }
  }

  return null;
}

export function extractGeminiError(error) {
  const nested = error?.error || {};
  const parsedMessage = typeof error?.message === "string" ? safeJson(error.message) : null;
  const parsedError = parsedMessage?.error || {};

  return {
    name: error?.name || nested.status || parsedError.status || "GeminiError",
    message: redactSecrets(
      parsedError.message || nested.message || error?.message || String(error),
    ),
    status:
      error?.status
      ?? error?.statusCode
      ?? nested.code
      ?? nested.status
      ?? parsedError.code
      ?? parsedError.status
      ?? error?.code,
    statusCode: error?.statusCode ?? error?.status ?? nested.code ?? parsedError.code,
    providerStatus: nested.status || parsedError.status || null,
    body: pickProviderBody(error),
  };
}

export function logGeminiError(context, error, extra = {}) {
  const details = extractGeminiError(error);
  const model = extra.model || getGeminiModel();

  console.error(`[Gemini] ${context} failed`);
  console.error(`[Gemini] model=${model}`);
  console.error(`[Gemini] name=${details.name}`);
  console.error(`[Gemini] status=${details.status ?? "unknown"} statusCode=${details.statusCode ?? "unknown"}`);
  console.error(`[Gemini] message=${details.message}`);

  if (env.NODE_ENV !== "development") {
    return details;
  }

  if (details.body) {
    console.error("[Gemini] provider response body:");
    console.error(JSON.stringify(details.body, null, 2));
  }

  console.error("[Gemini] original error (sanitized):");
  console.error(JSON.stringify(sanitizeForLog(error), null, 2));

  return details;
}

const RETRY_DELAYS_MS = [1000, 2000, 4000];
const MAX_RETRY_AFTER_MS = 30_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function headerValue(headers, name) {
  if (!headers) {
    return null;
  }
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(name.toLowerCase());
  }
  return headers[name] || headers[name.toLowerCase()] || null;
}

function parseDurationMs(value) {
  if (value == null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }
  const seconds = Number(text);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const match = text.match(/^(\d+(?:\.\d+)?)s$/i);
  if (match) {
    return Math.max(0, Number(match[1]) * 1000);
  }
  const date = Date.parse(text);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return null;
}

export function extractRetryAfterMs(error, details = extractGeminiError(error)) {
  const headers = error?.headers || error?.response?.headers;
  const fromHeader = parseDurationMs(headerValue(headers, "retry-after"));
  if (fromHeader != null) {
    return fromHeader;
  }

  const body = details.body || {};
  const nested = body.error || body;
  const detailsList = Array.isArray(nested.details) ? nested.details : [];
  for (const item of detailsList) {
    const delay = parseDurationMs(item?.retryDelay || item?.retry_delay);
    if (delay != null) {
      return delay;
    }
  }

  return parseDurationMs(error?.retryAfter || nested.retryDelay);
}

export function classifyGeminiFailure(error) {
  const details = extractGeminiError(error);
  const status = Number(details.status || details.statusCode);
  const message = String(details.message || "");
  const providerStatus = String(details.providerStatus || "");

  if (
    status === 401
    || status === 403
    || /api key|invalid.?key|permission denied|unauthenticated|unregistered callers/i.test(message)
  ) {
    return { retryable: false, reason: "auth", details };
  }

  if (status === 400 || status === 422) {
    return { retryable: false, reason: "bad_request", details };
  }

  if (status === 404 || (/model/i.test(message) && /not found|unsupported|does not exist/i.test(message))) {
    return { retryable: false, reason: "model_not_found", details };
  }

  if ((status === 429 || /resource.?exhausted/i.test(message) || providerStatus === "RESOURCE_EXHAUSTED")
    && /quota|free.?tier|billing|exceeded your current quota/i.test(message)) {
    return { retryable: false, reason: "quota", details };
  }

  if (status === 429 || /rate limit|too many requests|resource.?exhausted/i.test(message) || providerStatus === "RESOURCE_EXHAUSTED") {
    const retryAfterMs = extractRetryAfterMs(error, details);
    if (retryAfterMs != null && retryAfterMs > MAX_RETRY_AFTER_MS) {
      return { retryable: false, reason: "rate_limit_long_wait", details, retryAfterMs };
    }
    return { retryable: true, reason: "rate_limit", details, retryAfterMs };
  }

  if (
    status === 503
    || status === 502
    || status === 504
    || providerStatus === "UNAVAILABLE"
    || /unavailable|high demand|overloaded|try again later/i.test(message)
  ) {
    return { retryable: true, reason: "unavailable", details };
  }

  if (/fetch failed|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|EAI_AGAIN|socket|UND_ERR|network/i.test(message)) {
    return { retryable: true, reason: "network", details };
  }

  return { retryable: false, reason: "unknown", details };
}

export async function withGeminiRetry(requestFn, context) {
  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      const classification = classifyGeminiFailure(error);
      const status = classification.details.status ?? classification.details.statusCode ?? "unknown";
      const canRetry = classification.retryable && attempt < maxAttempts - 1;

      console.error(
        `[Gemini] ${context} attempt ${attempt + 1}/${maxAttempts} failed status=${status} reason=${classification.reason} retryable=${classification.retryable}`,
      );
      console.error(`[Gemini] provider message=${classification.details.message}`);

      if (!canRetry) {
        if (classification.retryable) {
          error.geminiRetriesExhausted = true;
        }
        throw error;
      }

      const delay = classification.retryAfterMs ?? RETRY_DELAYS_MS[attempt];
      console.error(`[Gemini] retrying ${context} in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}
