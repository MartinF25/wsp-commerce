import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import BlogCategoryForm from "../BlogCategoryForm";

type Props = { params: { id: string } };

export default async function EditBlogCategoryPage({ params }: Props) {
  const category = await api.blog.categories.get(params.id).catch(() => null);
  if (!category) notFound();

  return (
    <>
      <div className="page-header">
        <h1>Blog-Kategorie bearbeiten</h1>
        <Link href="/blog/categories" className="btn btn-secondary">← Zurück</Link>
      </div>
      <BlogCategoryForm category={category} />
    </>
  );
}
