import { env } from "../config/env.js";

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isUnhandled = !err.statusCode && statusCode === 500;

  if (isUnhandled) {
    console.error(err);
  }

  const rawMessage = err.message || "Internal server error";
  const leaked =
    /prisma|sql|stack|openai|gemini|stripe|secret|password|jwt/i.test(rawMessage) &&
    env.NODE_ENV === "production";
  const message =
    (env.NODE_ENV === "production" && isUnhandled) || leaked
      ? "Something went wrong. Please try again."
      : rawMessage;

  res.status(statusCode).json({
    success: false,
    message,
  });
}
