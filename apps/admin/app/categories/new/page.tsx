import Link from "next/link";
import { api } from "@/lib/api";
import CategoryForm from "../CategoryForm";

export default async function NewCategoryPage() {
  let parentOptions: { id: string; name: string }[] = [];
  try {
    const cats = await api.categories.list();
    parentOptions = cats.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    // non-fatal
  }

  return (
    <>
      <div className="page-header">
        <h1>Neue Kategorie</h1>
        <Link href="/categories" className="btn btn-secondary">← Zurück</Link>
      </div>
      <CategoryForm parentOptions={parentOptions} />
    </>
  );
}
