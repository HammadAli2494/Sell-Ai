import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export let isDatabaseConnected = false;

export async function connectDatabase() {
  await prisma.$connect();
  isDatabaseConnected = true;
}

export default prisma;
