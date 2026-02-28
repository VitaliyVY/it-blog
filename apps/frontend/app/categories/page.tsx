type Category = { id: number; name: string; slug: string; description: string | null };

export default async function CategoriesPage() {
  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/categories`, { cache: "no-store" });
  const json = await res.json();
  const items: Category[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Categories</h1>
      <ul>
        {items.map((c) => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            <a href={`/categories/${c.slug}`} style={{ fontWeight: 700 }}>{c.name}</a>
            {c.description ? <span style={{ opacity: 0.7 }}> — {c.description}</span> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}