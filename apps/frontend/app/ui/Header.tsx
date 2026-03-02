"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header style={{ borderBottom: "1px solid #ddd", padding: "12px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 16, alignItems: "center" }}>
        <a href="/" style={{ fontWeight: 800 }}>IT Blog</a>
        <nav style={{ display: "flex", gap: 12 }}>
          <a href="/categories/react">Categories</a>
          <a href="/tags/nextjs">Tags</a>
          <a href="/authors/john-doe">Authors</a>
          <a href="/admin">Admin</a>
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 8, width: 220 }}
          />
          <button
            onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            Go
          </button>
        </div>
      </div>
    </header>
  );
}