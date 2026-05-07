import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import BlogPostForm from "../BlogPostForm";

type Props = { params: { id: string } };

export default async function EditBlogPostPage({ params }: Props) {
  const [post, categories, tags] = await Promise.all([
    api.blog.posts.get(params.id).catch(() => null),
    api.blog.categories.list().catch(() => []),
    api.blog.tags.list().catch(() => []),
  ]);

  if (!post) notFound();

  return (
    <>
      <div className="page-header">
        <h1>Beitrag bearbeiten</h1>
        <Link href="/blog" className="btn btn-secondary">← Zurück</Link>
      </div>
      <div style={{ marginBottom: 8, fontSize: 12, color: "#64748b" }}>
        ID: <code>{post.id}</code> · Erstellt: {new Date(post.createdAt).toLocaleString("de-DE")}
      </div>
      <BlogPostForm post={post} categories={categories} tags={tags} />
    </>
  );
}
