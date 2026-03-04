"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
} from "../lib/admin-client";

type Tag = {
  id: number;
  name: string;
  slug: string;
};

const EMPTY_FORM = {
  name: "",
  slug: "",
};

export default function AdminTagsPage() {
  const [hasToken, setHasToken] = useState(false);
  const [items, setItems] = useState<Tag[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    setHasToken(Boolean(token));

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
        const res = await adminRequest("/admin/tags");
        const data = await parseResponse<Tag[]>(res);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tags");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await adminRequest(
        editingId ? `/admin/tags/${editingId}` : "/admin/tags",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
          }),
        }
      );

      const saved = await parseResponse<Tag>(res);

      setItems((current) => {
        if (!editingId) {
          return [...current, saved].sort((a, b) => a.name.localeCompare(b.name));
        }

        return current
          .map((item) => (item.id === editingId ? saved : item))
          .sort((a, b) => a.name.localeCompare(b.name));
      });

      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item: Tag) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
    });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this tag?")) return;

    try {
      const res = await adminRequest(`/admin/tags/${id}`, { method: "DELETE" });
      await parseResponse<{ deleted: boolean }>(res);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
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
        <h1 style={{ fontSize: 32, margin: 0 }}>Admin tags</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin">Admin home</Link>
          <Link href="/admin/articles">Articles</Link>
          <Link href="/admin/authors">Authors</Link>
          <Link href="/admin/categories">Categories</Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {!hasToken ? (
        <p>
          {error || "Sign in first."} <Link href="/admin">Go to login</Link>
        </p>
      ) : null}

      {hasToken && error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {hasToken && loading ? <p>Loading...</p> : null}

      {hasToken && !loading ? (
        <>
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: 14,
              border: "1px solid #ddd",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <h2 style={{ margin: 0 }}>{editingId ? "Edit tag" : "Create tag"}</h2>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
                required
                style={{ padding: 10 }}
              />
            </label>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="submit" disabled={saving} style={{ padding: "10px 14px" }}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

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
                    <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{item.name}</h2>
                    <p style={{ margin: 0, opacity: 0.8 }}>/ {item.slug}</p>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {!items.length ? <p>No tags yet.</p> : null}
        </>
      ) : null}
    </main>
  );
}
