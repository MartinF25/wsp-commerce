import Link from "next/link";
import { api } from "@/lib/api";
import { ReferencePriceManager } from "./ReferencePriceManager";

export const dynamic = "force-dynamic";

export default async function ReferenzpreisePage() {
  let prices = [];
  let error: string | null = null;

  try {
    const result = await api.marketReferencePrices.list();
    prices = result.data;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Referenzpreise</h1>
          <div className="page-subtitle">
            Marktpreise (Neupreis) und EK-Richtwerte pro Kategorie – werden als Kontext für die Deal-Analyse und Margen-Anzeige genutzt.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/market" className="btn btn-secondary btn-sm">← Listings</Link>
          <Link href="/market/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <ReferencePriceManager initial={prices} />
    </div>
  );
}
