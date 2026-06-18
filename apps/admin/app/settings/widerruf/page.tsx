import { api } from "@/lib/api";
import { WiderrufSettingsForm } from "./WiderrufSettingsForm";

export const dynamic = "force-dynamic";

export default async function WiderrufSettingsPage() {
  let settings: Awaited<ReturnType<typeof api.cancellationSettings.get>> | null = null;
  let excludedProducts: Awaited<ReturnType<typeof api.cancellationSettings.excludedProducts.list>> = [];
  let excludedCategories: Awaited<ReturnType<typeof api.cancellationSettings.excludedCategories.list>> = [];
  let error: string | null = null;

  try {
    [settings, excludedProducts, excludedCategories] = await Promise.all([
      api.cancellationSettings.get(),
      api.cancellationSettings.excludedProducts.list(),
      api.cancellationSettings.excludedCategories.list(),
    ]);
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Widerruf-Einstellungen</h1>
          <p className="page-subtitle">Feature-Konfiguration, Fristen, E-Mail und Ausschlüsse</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {settings && (
        <WiderrufSettingsForm
          settings={settings}
          excludedProducts={excludedProducts}
          excludedCategories={excludedCategories}
        />
      )}
    </>
  );
}
