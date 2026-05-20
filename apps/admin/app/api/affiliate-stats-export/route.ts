import { api } from "@/lib/api";
import type { AffiliateProductStats } from "@/lib/api";

export const dynamic = "force-dynamic";

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsvRow(cols: (string | number | null)[]): string {
  return cols.map(escapeCsv).join(",");
}

export async function GET() {
  let products: AffiliateProductStats[] = [];

  try {
    const result = await api.affiliate.getStats();
    products = result.data.products;
  } catch {
    return new Response("Fehler beim Laden der Statistiken.", { status: 500 });
  }

  const header = toCsvRow([
    "slug",
    "title",
    "status",
    "affiliate_provider",
    "clicks_7d",
    "clicks_30d",
    "clicks_total",
    "last_clicked_at",
  ]);

  const rows = products
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .map((p) =>
      toCsvRow([
        p.slug,
        p.title,
        p.status,
        p.affiliateProvider,
        p.clicksLast7Days,
        p.clicksLast30Days,
        p.totalClicks,
        p.lastClickedAt
          ? new Date(p.lastClickedAt).toLocaleString("de-DE")
          : null,
      ])
    );

  const csv = [header, ...rows].join("\r\n");
  const filename = `affiliate-stats-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
