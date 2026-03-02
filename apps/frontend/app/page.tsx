import { formatDate } from "./lib/format-date";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
};

export default async function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/articles?limit=15`, { cache: "no-store" });
  const json = await res.json();

  const articles: Article[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>IT Blog</h1>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 16 }}>
        {articles.map((a) => (
          <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <a href={`/articles/${a.slug}`} style={{ fontSize: 20, fontWeight: 700 }}>
              {a.title}
            </a>
            <p style={{ marginTop: 8 }}>{a.excerpt}</p>
            <small style={{ opacity: 0.8 }}>
              {a.category_name} • {a.author_name} •{" "}
              {formatDate(a.published_at)}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}
