import OpenAI from "openai";
import { env } from "./env.js";
import { HttpError } from "../utils/apiResponse.js";

let client;

export function isOpenAIConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}

export function requireOpenAI() {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(503, "AI is not configured");
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return client;
}
