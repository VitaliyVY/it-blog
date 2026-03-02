import Link from "next/link";
import { formatDate } from "../../lib/format-date";

type Author = {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
};

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category_name: string;
  category_slug: string;
  published_at: string | null;
};

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const api = process.env.NEXT_PUBLIC_API_URL!;

  const [aRes, listRes] = await Promise.all([
    fetch(`${api}/authors/${slug}`, { cache: "no-store" }),
    fetch(`${api}/authors/${slug}/articles`, { cache: "no-store" }),
  ]);

  if (!aRes.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Author not found</h1>
      </main>
    );
  }

  const authorJson = await aRes.json();
  const listJson = listRes.ok ? await listRes.json() : { data: [] };

  const author: Author = authorJson.data;
  const items: Article[] = listJson.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Link href="/authors" style={{ display: "inline-block", marginBottom: 12 }}>
        All authors
      </Link>

      <h1 style={{ fontSize: 32, marginBottom: 6 }}>{author.name}</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>{author.bio || "No bio yet."}</p>

      <h2 style={{ marginTop: 24 }}>Articles</h2>

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
              {a.published_at ? ` | ${formatDate(a.published_at)}` : ""}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
