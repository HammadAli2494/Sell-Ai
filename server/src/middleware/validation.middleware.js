import { HttpError } from "../utils/apiResponse.js";

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request";
      next(new HttpError(400, message));
      return;
    }

    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request";
      next(new HttpError(400, message));
      return;
    }

    req.validatedQuery = parsed.data;
    next();
  };
}
