"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
} from "../lib/admin-client";

type ArticleItem = {
  id: number;
  title: string;
  slug: string;
  status: string;
  category_slug: string;
  author_slug: string;
  published_at: string | null;
};

export default function AdminArticlesPage() {
  const [hasToken, setHasToken] = useState(false);
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    setHasToken(Boolean(token));
    setReady(true);

    if (!token) {
      setLoading(false);
      setError("Sign in first.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await adminRequest("/admin/articles");
        const data = await parseResponse<ArticleItem[]>(res);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load articles");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this article?")) return;

    try {
      const res = await adminRequest(`/admin/articles/${id}`, { method: "DELETE" });
      await parseResponse<{ deleted: boolean }>(res);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function handleLogout() {
    clearAdminToken();
    setHasToken(false);
    setItems([]);
    setError("Signed out.");
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 32, margin: 0 }}>Admin articles</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin">Admin home</Link>
          <Link href="/admin/authors">Authors</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/tags">Tags</Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {ready && !hasToken ? (
        <p>
          {error} <Link href="/admin">Go to login</Link>
        </p>
      ) : null}

      {error && hasToken ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/articles/new">Create article</Link>
      </div>

      {loading ? <p>Loading...</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <section
            key={item.id}
            style={{ border: "1px solid #ddd", borderRadius: 14, padding: 16 }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "space-between",
                alignItems: "start",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{item.title}</h2>
                <p style={{ margin: "0 0 8px", opacity: 0.8 }}>
                  /{item.slug} | {item.status}
                </p>
                <small style={{ opacity: 0.8 }}>
                  {item.category_slug} | {item.author_slug}
                  {item.published_at ? ` | ${item.published_at}` : ""}
                </small>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Link href={`/admin/articles/${item.id}`}>Edit</Link>
                <button type="button" onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>

      {!loading && !items.length && hasToken ? <p>No articles yet.</p> : null}
    </main>
  );
}
