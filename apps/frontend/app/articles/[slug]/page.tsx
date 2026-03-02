import { formatDate } from "../../lib/format-date";

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

type RelatedArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  author_name: string;
  author_slug: string;
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
  const relatedRes = await fetch(`${api}/categories/${a.category_slug}/articles`, {
    cache: "no-store",
  });
  const relatedJson = relatedRes.ok ? await relatedRes.json() : { data: [] };
  const relatedArticles: RelatedArticle[] = (relatedJson.data ?? []).filter(
    (item: RelatedArticle) => item.slug !== a.slug
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <a href="/" style={{ display: "inline-block", marginBottom: 12 }}>
         Back
      </a>

      <h1 style={{ fontSize: 34, marginBottom: 8 }}>{a.title}</h1>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        <a href={`/categories/${a.category_slug}`}>{a.category_name}</a> •{" "}
        <a href={`/authors/${a.author_slug}`}>{a.author_name}</a> •{" "}
        {formatDate(a.published_at)}
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

      {relatedArticles.length ? (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Related articles</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
            {relatedArticles.map((item) => (
              <li
                key={item.id}
                style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}
              >
                <a href={`/articles/${item.slug}`} style={{ fontSize: 18, fontWeight: 700 }}>
                  {item.title}
                </a>
                {item.excerpt ? <p style={{ marginTop: 8 }}>{item.excerpt}</p> : null}
                <small style={{ opacity: 0.8 }}>
                  <a href={`/authors/${item.author_slug}`}>{item.author_name}</a> {" | "}
                  {formatDate(item.published_at)}
                </small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
