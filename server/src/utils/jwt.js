import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const TOKEN_EXPIRES_IN = "7d";

export function signAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: TOKEN_EXPIRES_IN },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
}
