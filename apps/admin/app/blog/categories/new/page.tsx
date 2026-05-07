import Link from "next/link";
import BlogCategoryForm from "../BlogCategoryForm";

export default function NewBlogCategoryPage() {
  return (
    <>
      <div className="page-header">
        <h1>Neue Blog-Kategorie</h1>
        <Link href="/blog/categories" className="btn btn-secondary">← Zurück</Link>
      </div>
      <BlogCategoryForm />
    </>
  );
}
