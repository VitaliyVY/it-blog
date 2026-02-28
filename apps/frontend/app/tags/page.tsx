type Tag = { id: number; name: string; slug: string };

export default async function TagsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/tags`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Tags</h1>
        <p>Failed to load tags.</p>
      </main>
    );
  }

  const json = await res.json();
  const items: Tag[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Tags</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        {items.map((t) => (
          <a
            key={t.id}
            href={`/tags/${t.slug}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: 999,
              padding: "6px 10px",
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            #{t.name}
          </a>
        ))}
      </div>
    </main>
  );
}