import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as aiService from "../services/ai.service.js";

export const getUsage = asyncHandler(async (req, res) => {
  const usage = await aiService.getUsage(req.store.id);
  sendSuccess(res, { usage });
});

export const generate = asyncHandler(async (req, res) => {
  const generated = await aiService.generate(req.store.id, req.store.name, req.body);
  sendSuccess(res, generated);
});

export const getPublicStatus = asyncHandler(async (req, res) => {
  const status = await aiService.getPublicChatStatus(req.store.id);
  sendSuccess(res, status);
});

export const chat = asyncHandler(async (req, res) => {
  const result = await aiService.chat(req.store.id, req.store.name, req.body);
  sendSuccess(res, result);
});
