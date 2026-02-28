type Tag = { name: string; slug: string };

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published_at: string | null;
  category_name: string;
  category_slug: string;
  author_name: string;
  author_slug: string;
  tags: Tag[];
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/articles/${slug}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Not found</h1>
      </main>
    );
  }

  const json = await res.json();
  const a: Article = json.data;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
         Back
      </a>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>{a.title}</h1>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        <a href={`/categories/${a.category_slug}`}>{a.category_name}</a> •{" "}
        <a href={`/authors/${a.author_slug}`}>{a.author_name}</a> •{" "}
        {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
      </div>

      {a.tags?.length ? (
        <div style={{ marginBottom: 16 }}>
          {a.tags.map((t) => (
            <a
              key={t.slug}
              href={`/tags/${t.slug}`}
              style={{
                display: "inline-block",
                padding: "4px 10px",
                border: "1px solid #ddd",
                borderRadius: 999,
                marginRight: 8,
                marginBottom: 8,
                textDecoration: "none",
              }}
            >
              #{t.name}
            </a>
          ))}
        </div>
      ) : null}

      <article style={{ lineHeight: 1.6, fontSize: 18, whiteSpace: "pre-wrap" }}>
        {a.content}
      </article>
    </main>
  );
}