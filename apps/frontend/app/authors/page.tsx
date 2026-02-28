import Link from "next/link";

type Author = { id: number; name: string; slug: string; bio: string | null };

export default async function AuthorsPage() {
  const api = process.env.NEXT_PUBLIC_API_URL!;
  const res = await fetch(`${api}/authors`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Authors</h1>
        <p>Failed to load authors.</p>
      </main>
    );
  }

  const json = await res.json();
  const items: Author[] = json.data ?? [];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Authors</h1>

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {items.map((a) => (
          <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
            <Link href={`/authors/${a.slug}`} style={{ fontSize: 18, fontWeight: 700 }}>
              {a.name}
            </Link>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              {a.bio || "No bio yet."}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}