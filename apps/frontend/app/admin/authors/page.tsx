"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  adminRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
} from "../lib/admin-client";

type Author = {
  id: number;
  name: string;
  slug: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
};

type AuthorForm = {
  name: string;
  slug: string;
  email: string;
  password: string;
  bio: string;
  avatar_url: string;
  is_admin: boolean;
};

const EMPTY_FORM: AuthorForm = {
  name: "",
  slug: "",
  email: "",
  password: "",
  bio: "",
  avatar_url: "",
  is_admin: false,
};

export default function AdminAuthorsPage() {
  const [hasToken, setHasToken] = useState(false);
  const [items, setItems] = useState<Author[]>([]);
  const [form, setForm] = useState<AuthorForm>(EMPTY_FORM);
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
        const res = await adminRequest("/admin/authors");
        const data = await parseResponse<Author[]>(res);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load authors");
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

  function updateField(field: keyof AuthorForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        email: form.email,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
        is_admin: form.is_admin,
      };

      if (!editingId || form.password.trim()) {
        payload.password = form.password;
      }

      const res = await adminRequest(
        editingId ? `/admin/authors/${editingId}` : "/admin/authors",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const saved = await parseResponse<Author>(res);

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

  function handleEdit(item: Author) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      email: item.email,
      password: "",
      bio: item.bio || "",
      avatar_url: item.avatar_url || "",
      is_admin: item.is_admin,
    });
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this author?")) return;

    try {
      const res = await adminRequest(`/admin/authors/${id}`, { method: "DELETE" });
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
        <h1 style={{ fontSize: 32, margin: 0 }}>Admin authors</h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin">Admin home</Link>
          <Link href="/admin/articles">Articles</Link>
          <Link href="/admin/categories">Categories</Link>
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
            <h2 style={{ margin: 0 }}>{editingId ? "Edit author" : "Create author"}</h2>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Slug</span>
              <input
                value={form.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                required
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>{editingId ? "New password (optional)" : "Password"}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required={!editingId}
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Avatar URL</span>
              <input
                value={form.avatar_url}
                onChange={(event) => updateField("avatar_url", event.target.value)}
                style={{ padding: 10 }}
              />
            </label>

            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Author preview"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: "cover",
                  borderRadius: 14,
                  border: "1px solid #ddd",
                }}
              />
            ) : null}

            <label style={{ display: "grid", gap: 6 }}>
              <span>Bio</span>
              <textarea
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                rows={4}
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(event) => updateField("is_admin", event.target.checked)}
              />
              <span>Admin user</span>
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
                    display: "grid",
                    gap: 14,
                    gridTemplateColumns: "72px 1fr auto",
                    alignItems: "start",
                  }}
                >
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.name}
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
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h2 style={{ fontSize: 20, margin: "0 0 8px" }}>{item.name}</h2>
                    <p style={{ margin: "0 0 6px", opacity: 0.8 }}>
                      @{item.slug} | {item.email}
                    </p>
                    <p style={{ margin: "0 0 6px" }}>{item.bio || "No bio yet."}</p>
                    <small style={{ opacity: 0.8 }}>
                      {item.is_admin ? "Admin" : "Author"}
                    </small>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

          {!items.length ? <p>No authors yet.</p> : null}
        </>
      ) : null}
    </main>
  );
}
