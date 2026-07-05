import type { MiddlewareHandler } from "hono";

export const requireAdminKey: MiddlewareHandler = async (c, next) => {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    return c.json(
      {
        error: {
          code: "ADMIN_NOT_CONFIGURED",
          message: "Admin-API ist nicht konfiguriert. ADMIN_SECRET setzen.",
          status: 503,
        },
      },
      503
    );
  }

  const qs = c.req.url.includes("?") ? c.req.url.split("?")[1] : "";
  const urlKey = new URLSearchParams(qs).get("key") ?? undefined;
  const provided =
    c.req.header("X-Admin-Key") ??
    c.req.header("Authorization")?.replace(/^Bearer\s+/i, "") ??
    urlKey;

  if (!provided || provided.trim() !== secret) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Ungültiger oder fehlender Admin-Key. [v4]",
          status: 401,
        },
      },
      401
    );
  }

  await next();
};
