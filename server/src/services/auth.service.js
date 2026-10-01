import prisma from "../config/database.js";
import { HttpError } from "../utils/apiResponse.js";
import { signAuthToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";

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

export async function loginUser({ email, password, expectedRole }) {
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

  if (expectedRole === "CUSTOMER" && user.role !== "CUSTOMER") {
    throw new HttpError(403, "Use merchant login for store dashboards");
  }

  if (expectedRole === "MERCHANT" && user.role === "CUSTOMER") {
    throw new HttpError(403, "Use customer login for shopper accounts");
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    city: user.city,
    state: user.state,
    postalCode: user.postalCode,
    country: user.country,
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    token: signAuthToken(safeUser),
  };
}

export async function registerCustomer({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER",
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

export async function updateProfile(userId, payload) {
  const data = {};
  for (const key of ["name", "phone", "address", "city", "state", "postalCode", "country"]) {
    if (payload[key] !== undefined) {
      data[key] = payload[key] ? String(payload[key]).trim() : null;
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new HttpError(401, "Authentication required");
  }

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) {
    throw new HttpError(400, "Current password is incorrect");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return { message: "Password updated" };
}
