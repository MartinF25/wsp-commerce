import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditProductPage({ params }: Props) {
  let product: Awaited<ReturnType<typeof api.products.get>>;
  let categories: { id: string; name: string }[] = [];

  try {
    [product, categories] = await Promise.all([
      api.products.get(params.id),
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
        <h1>
          {product.translations.find((t) => t.locale === "de")?.name ?? product.slug}
        </h1>
        <Link href="/products" className="btn btn-secondary">← Zurück</Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </>
  );
}
