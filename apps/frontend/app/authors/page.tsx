import Link from "next/link";
import { resolveMediaUrl } from "../lib/media-url";

type Author = {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
};

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
          <li
            key={a.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 14,
              padding: 16,
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              gap: 14,
              alignItems: "start",
            }}
          >
            {resolveMediaUrl(a.avatar_url) ? (
              <img
                src={resolveMediaUrl(a.avatar_url)}
                alt={a.name}
                width={72}
                height={72}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  background: "#f3f4f6",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#6b7280",
                }}
              >
                {a.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <Link href={`/authors/${a.slug}`} style={{ fontSize: 18, fontWeight: 700 }}>
                {a.name}
              </Link>
              <div style={{ opacity: 0.8, marginTop: 6 }}>@{a.slug}</div>
              <div style={{ marginTop: 8 }}>{a.bio || "No bio yet."}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
