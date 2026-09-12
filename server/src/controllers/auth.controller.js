import { asyncHandler } from "../middleware/error.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = await authService.registerUser(req.body);
  sendSuccess(res, data, 201);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.loginUser(req.body);
  sendSuccess(res, data);
});

export const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});
