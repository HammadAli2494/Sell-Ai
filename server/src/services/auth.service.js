import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { signAuthToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function registerUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "MERCHANT",
      },
      select: userSelect,
    });

    return {
      user,
      token: signAuthToken(user),
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    token: signAuthToken(safeUser),
  };
}
