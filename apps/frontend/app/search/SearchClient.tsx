"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category_name: string;
  author_name: string;
};

export default function SearchClient() {
  const sp = useSearchParams();
  const q = useMemo(() => sp.get("q") || "", [sp]);
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!q) {
        setItems([]);
        return;
      }

      setLoading(true);
      try {
        const api = process.env.NEXT_PUBLIC_API_URL!;
        const res = await fetch(`${api}/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setItems(json.data ?? []);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [q]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Search</h1>
      <p style={{ opacity: 0.8 }}>
        Query: <b>{q}</b>
      </p>

      {loading ? <p>Loading...</p> : null}

      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {items.map((a) => (
          <li
            key={a.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <a href={`/articles/${a.slug}`} style={{ fontSize: 18, fontWeight: 700 }}>
              {a.title}
            </a>
            <p style={{ margin: "8px 0" }}>{a.excerpt}</p>
            <small style={{ opacity: 0.8 }}>
              {a.category_name} • {a.author_name}
            </small>
          </li>
        ))}
      </ul>
    </main>
  );
}