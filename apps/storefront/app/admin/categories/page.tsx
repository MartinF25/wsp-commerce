import { loadCategories } from "./actions";
import { CategoryTranslationEditor } from "./CategoryTranslationEditor";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const adminKey = process.env.ADMIN_SECRET;

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow text-center">
          <p className="text-red-600 font-medium">ADMIN_SECRET nicht konfiguriert.</p>
          <p className="text-sm text-gray-500 mt-1">
            Bitte ADMIN_SECRET als Umgebungsvariable in Vercel setzen.
          </p>
        </div>
      </div>
    );
  }

  let categories;
  try {
    categories = await loadCategories();
  } catch (err) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow text-center">
          <p className="text-red-600 font-medium">Kategorien konnten nicht geladen werden.</p>
          <p className="text-sm text-gray-500 mt-1">
            {err instanceof Error ? err.message : "Commerce API nicht erreichbar"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kategorie-Übersetzungen</h1>
          <p className="text-sm text-gray-500 mt-1">
            Name und SEO-Felder für jede Kategorie in allen drei Sprachen pflegen.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-500">Keine Kategorien gefunden.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <CategoryTranslationEditor key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
