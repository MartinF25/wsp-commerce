import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CategoryForm from "../CategoryForm";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditCategoryPage({ params }: Props) {
  let category;
  let parentOptions: { id: string; name: string }[] = [];

  try {
    [category, parentOptions] = await Promise.all([
      api.categories.get(params.id),
      api.categories.list().then((cats) => cats.map((c) => ({ id: c.id, name: c.name }))),
    ]);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("nicht gefunden") || msg.includes("404")) notFound();
    throw e;
  }

  return (
    <>
      <div className="page-header">
        <h1>Kategorie: {category.name}</h1>
        <Link href="/categories" className="btn btn-secondary">← Zurück</Link>
      </div>
      <CategoryForm category={category} parentOptions={parentOptions} />
    </>
  );
}
