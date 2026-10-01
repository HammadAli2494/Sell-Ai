import express from "express";
import cors from "cors";
import helmet from "helmet";
import { isDatabaseConnected } from "./config/database.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import aiRoutes from "./routes/ai.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import authRoutes from "./routes/auth.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import publicRoutes from "./routes/public.routes.js";
import storeRoutes from "./routes/store.routes.js";
import { webhook as billingWebhook } from "./controllers/billing.controller.js";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  billingWebhook,
);
app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const pathOnly = (req.originalUrl || "").split("?")[0];
    console.log(`${req.method} ${pathOnly} ${res.statusCode} ${durationMs}ms`);
  });

  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      database: isDatabaseConnected ? "connected" : "disconnected",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
