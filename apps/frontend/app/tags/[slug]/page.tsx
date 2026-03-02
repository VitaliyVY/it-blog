import Link from "next/link";
import { formatDate } from "../../lib/format-date";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
  published_at: string | null;
};

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/tags/${slug}/articles`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Tag not found</h1>
      </main>
    );
  }

  const json = await res.json();
  const items: Article[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Link href="/tags" style={{ display: "inline-block", marginBottom: 12 }}>
        All tags
      </Link>

      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Tag: {slug}</h1>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {items.map((a) => (
          <li
            key={a.id}
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}
          >
            <Link href={`/articles/${a.slug}`} style={{ fontSize: 18, fontWeight: 700 }}>
              {a.title}
            </Link>

            <p style={{ margin: "8px 0" }}>{a.excerpt}</p>

            <small style={{ opacity: 0.8 }}>
              <Link href={`/categories/${a.category_slug}`}>{a.category_name}</Link>
              {" | "}
              <Link href={`/authors/${a.author_slug}`}>{a.author_name}</Link>
              {a.published_at ? ` | ${formatDate(a.published_at)}` : ""}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
