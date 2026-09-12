import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await connectDatabase();
    console.log("Connected to PostgreSQL");
  } catch (error) {
    console.error("PostgreSQL is not connected yet.");
    console.error("Set DATABASE_URL in server/.env, then run: npx prisma migrate dev");
    console.error(error.message);
  }

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start();
