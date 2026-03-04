"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
} from "../lib/admin-client";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
};

export default function AdminCategoriesPage() {
  const [hasToken, setHasToken] = useState(false);
  const [items, setItems] = useState<Category[]>([]);
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
        const res = await adminRequest("/admin/categories");
        const data = await parseResponse<Category[]>(res);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load categories");
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
        editingId ? `/admin/categories/${editingId}` : "/admin/categories",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
          }),
        }
      );

      const saved = await parseResponse<Category>(res);

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

  function handleEdit(item: Category) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
    });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this category?")) return;

    try {
      const res = await adminRequest(`/admin/categories/${id}`, { method: "DELETE" });
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
        <h1 style={{ fontSize: 32, margin: 0 }}>Admin categories</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin">Admin home</Link>
          <Link href="/admin/articles">Articles</Link>
          <Link href="/admin/authors">Authors</Link>
          <Link href="/admin/tags">Tags</Link>
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
            <h2 style={{ margin: 0 }}>{editingId ? "Edit category" : "Create category"}</h2>

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

            <label style={{ display: "grid", gap: 6 }}>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={3}
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
                    <p style={{ margin: "0 0 8px", opacity: 0.8 }}>/ {item.slug}</p>
                    {item.description ? <p style={{ margin: 0 }}>{item.description}</p> : null}
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

          {!items.length ? <p>No categories yet.</p> : null}
        </>
      ) : null}
    </main>
  );
}
