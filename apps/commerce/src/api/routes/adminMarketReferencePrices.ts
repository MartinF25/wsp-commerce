import { Hono } from "hono";
import { getPrismaClient } from "../../lib/prisma";
import { requireAdminKey } from "../middleware/requireAdminKey";

export const adminMarketReferencePriceRoutes = new Hono();
adminMarketReferencePriceRoutes.use("*", requireAdminKey);

// ─── GET / ────────────────────────────────────────────────────────────────────

adminMarketReferencePriceRoutes.get("/", async (c) => {
  const prisma = getPrismaClient();
  const keyword = c.req.query("keyword");

  const prices = await prisma.marketReferencePrice.findMany({
    where: keyword ? { keyword } : undefined,
    orderBy: [{ keyword: "asc" }, { vk_eur: "asc" }],
  });

  return c.json({ data: prices, total: prices.length });
});

// ─── POST /sync ───────────────────────────────────────────────────────────────
// n8n liest Google Sheet und schickt alle Zeilen auf einmal.
// Kompletter Replace: alles löschen, neu einfügen.

adminMarketReferencePriceRoutes.post("/sync", async (c) => {
  const prisma = getPrismaClient();

  let body: unknown;
  try { body = await c.req.json(); } catch {
    return c.json({ error: { code: "INVALID_BODY", message: "JSON erforderlich." } }, 422);
  }

  const raw = body as Record<string, unknown>;
  if (!Array.isArray(raw.items)) {
    return c.json({ error: { code: "INVALID_BODY", message: "items Array erforderlich." } }, 422);
  }

  type RawItem = { keyword?: unknown; productName?: unknown; ek_eur?: unknown; vk_eur?: unknown; notes?: unknown };
  const items = raw.items as RawItem[];

  const validated = items
    .filter((item) => item.keyword && item.productName && item.vk_eur != null)
    .map((item) => ({
      keyword: String(item.keyword).toLowerCase().trim(),
      productName: String(item.productName).trim(),
      ek_eur: item.ek_eur != null && item.ek_eur !== "" ? Math.round(Number(item.ek_eur)) : null,
      vk_eur: Math.round(Number(item.vk_eur)),
      notes: item.notes ? String(item.notes).trim() : null,
    }));

  if (validated.length === 0) {
    return c.json({ error: { code: "INVALID_BODY", message: "Keine gültigen Einträge." } }, 422);
  }

  await prisma.$transaction([
    prisma.marketReferencePrice.deleteMany(),
    prisma.marketReferencePrice.createMany({ data: validated }),
  ]);

  return c.json({ ok: true, synced: validated.length });
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

adminMarketReferencePriceRoutes.delete("/:id", async (c) => {
  const prisma = getPrismaClient();
  const id = c.req.param("id");

  const existing = await prisma.marketReferencePrice.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return c.json({ error: { code: "NOT_FOUND", message: "Referenzpreis nicht gefunden." } }, 404);
  }

  await prisma.marketReferencePrice.delete({ where: { id } });
  return c.json({ ok: true });
});
