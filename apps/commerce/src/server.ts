import { serve } from "@hono/node-server";
import { createApp } from "./api/app";
import { disconnectPrisma } from "./lib/prisma";

const PORT = parseInt(process.env.PORT ?? "3001", 10); // v3 – force Docker source build
const app = createApp();

// ─── Server starten ───────────────────────────────────────────────────────────

const server = serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`[commerce] API läuft auf http://localhost:${info.port}`);
    console.log(`[commerce] Endpunkte:`);
    console.log(`  GET   /health`);
    console.log(`  GET   /api/catalog/products`);
    console.log(`  GET   /api/catalog/products/:slug`);
    console.log(`  GET   /api/catalog/categories`);
    console.log(`  GET   /api/catalog/categories/:slug`);
    console.log(`  --- Admin (X-Admin-Key erforderlich) ---`);
    console.log(`  GET   /api/admin/products`);
    console.log(`  PATCH /api/admin/products/:id/status`);
    console.log(`  GET   /api/admin/categories`);
    console.log(`  PATCH /api/admin/categories/:id/visibility`);
  }
);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`[commerce] ${signal} empfangen – fahre herunter …`);
  await disconnectPrisma();
  server.close(() => {
    console.log("[commerce] Server gestoppt.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
