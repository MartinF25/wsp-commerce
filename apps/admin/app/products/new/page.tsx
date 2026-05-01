import Link from "next/link";
import { api } from "@/lib/api";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  try {
    const cats = await api.categories.list();
    categories = cats.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    // non-fatal
  }

  return (
    <>
      <div className="page-header">
        <h1>Neues Produkt</h1>
        <Link href="/products" className="btn btn-secondary">← Zurück</Link>
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
