import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { query } from "./db";
import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";

const app = Fastify({
  logger: true,
  // Article cover images are currently stored as data URLs in JSON payloads.
  // Increase limit to avoid abrupt connection drops on larger uploads.
  bodyLimit: 10 * 1024 * 1024,
});

async function ensureMediaColumnsAreText() {
  await query(`ALTER TABLE articles ALTER COLUMN cover_url TYPE TEXT`);
  await query(`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT`);
}

async function main() {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "change-me",
  });

  try {
    await ensureMediaColumnsAreText();
  } catch (error) {
    app.log.warn({ error }, "Could not auto-migrate image URL columns to TEXT");
  }

  // healthcheck
  app.get("/health", async () => ({ ok: true }));

  // routes
  await app.register(publicRoutes, { prefix: "/api" });
  await app.register(adminRoutes, { prefix: "/api" });

  const port = Number(process.env.PORT || 4000);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
