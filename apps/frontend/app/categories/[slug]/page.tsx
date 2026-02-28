type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  author_name: string;
  author_slug: string;
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/categories/${slug}/articles`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Category not found</h1>
      </main>
    );
  }

  const json = await res.json();
  const items: Article[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      
      {/* 🔹 ОЦЕ МИ ДОДАЛИ */}
      <a
        href="/categories"
        style={{ display: "inline-block", marginBottom: 12 }}
      >
         All categories
      </a>

      <h1 style={{ fontSize: 28, marginBottom: 16 }}>
        Category: {slug}
      </h1>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {items.map((a) => (
          <li
            key={a.id}
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}
          >
            <a
              href={`/articles/${a.slug}`}
              style={{ fontSize: 18, fontWeight: 700 }}
            >
              {a.title}
            </a>
            <p style={{ margin: "8px 0" }}>{a.excerpt}</p>
            <small style={{ opacity: 0.8 }}>
              by{" "}
              <a href={`/authors/${a.author_slug}`}>
                {a.author_name}
              </a>{" "}
              {a.published_at
                ? `• ${new Date(a.published_at).toLocaleDateString()}`
                : ""}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}