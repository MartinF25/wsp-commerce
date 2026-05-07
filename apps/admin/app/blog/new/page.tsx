import Link from "next/link";
import { api } from "@/lib/api";
import BlogPostForm from "../BlogPostForm";

export default async function NewBlogPostPage() {
  const [categories, tags] = await Promise.all([
    api.blog.categories.list().catch(() => []),
    api.blog.tags.list().catch(() => []),
  ]);

  return (
    <>
      <div className="page-header">
        <h1>Neuer Blog-Beitrag</h1>
        <Link href="/blog" className="btn btn-secondary">← Zurück</Link>
      </div>
      <BlogPostForm categories={categories} tags={tags} />
    </>
  );
}
