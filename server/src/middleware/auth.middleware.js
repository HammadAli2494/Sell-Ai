import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { verifyAuthToken } from "../utils/jwt.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
};

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new HttpError(401, "Authentication required");
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw new HttpError(401, "Authentication required");
    }

    if (!payload?.userId || typeof payload.userId !== "string") {
      throw new HttpError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: userSelect,
    });

    if (!user) {
      throw new HttpError(401, "Authentication required");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new HttpError(403, "You do not have permission to do that"));
      return;
    }

    next();
  };
}
