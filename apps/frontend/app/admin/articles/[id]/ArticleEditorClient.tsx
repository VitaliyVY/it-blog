"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "../../../lib/media-url";
import {
  adminRequest,
  apiRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
} from "../../lib/admin-client";

type ArticleRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  status: string;
  category_id: number;
  author_id: number;
  published_at: string | null;
};

type CategoryOption = {
  id: number;
  name: string;
};

type AuthorOption = {
  id: number;
  name: string;
};

type ArticleForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  status: string;
  category_id: string;
  author_id: string;
  published_at: string;
};

const EMPTY_FORM: ArticleForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_url: "",
  status: "draft",
  category_id: "",
  author_id: "",
  published_at: "",
};

const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function toDateTimeInput(value: string | null) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return normalized.slice(0, 16);
}

export default function ArticleEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [hasToken, setHasToken] = useState(false);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
        const requests: Promise<Response>[] = [
          apiRequest("/categories"),
          apiRequest("/authors"),
        ];

        if (!isNew) {
          requests.push(adminRequest(`/admin/articles/${id}`));
        }

        const responses = await Promise.all(requests);
        const categoryData = await parseResponse<CategoryOption[]>(responses[0]);
        const authorData = await parseResponse<AuthorOption[]>(responses[1]);

        if (cancelled) return;

        setCategories(categoryData);
        setAuthors(authorData);

        if (isNew) {
          setForm((current) => ({
            ...current,
            category_id: current.category_id || String(categoryData[0]?.id || ""),
            author_id: current.author_id || String(authorData[0]?.id || ""),
          }));
        } else {
          const article = await parseResponse<ArticleRecord>(responses[2]);
          if (cancelled) return;

          setForm({
            title: article.title || "",
            slug: article.slug || "",
            excerpt: article.excerpt || "",
            content: article.content || "",
            cover_url: article.cover_url || "",
            status: article.status || "draft",
            category_id: String(article.category_id || categoryData[0]?.id || ""),
            author_id: String(article.author_id || authorData[0]?.id || ""),
            published_at: toDateTimeInput(article.published_at),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load editor");
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
  }, [id, isNew]);

  function updateField(field: keyof ArticleForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");

    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      setError("Image is too large. Select a file up to 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((current) => ({ ...current, cover_url: result }));
      setNotice("Image loaded into cover_url as a data URL.");
    };
    reader.onerror = () => {
      setError("Could not read selected image.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt || null,
        content: form.content,
        cover_url: form.cover_url || null,
        status: form.status,
        category_id: Number(form.category_id),
        author_id: Number(form.author_id),
        published_at: form.published_at || null,
      };

      const res = await adminRequest(
        isNew ? "/admin/articles" : `/admin/articles/${id}`,
        {
          method: isNew ? "POST" : "PUT",
          body: JSON.stringify(payload),
        }
      );

      await parseResponse<ArticleRecord>(res);
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof Error && err.message === "Failed to fetch") {
        setError(
          "Network error while saving. Check backend availability/CORS or try a smaller image."
        );
      } else {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setHasToken(false);
    router.push("/admin");
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
        <h1 style={{ fontSize: 32, margin: 0 }}>
          {isNew ? "Create article" : "Edit article"}
        </h1>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/admin/articles">Back to articles</Link>
          <Link href="/admin/authors">Authors</Link>
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

      {error && hasToken ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      {notice ? <p style={{ color: "#166534" }}>{notice}</p> : null}
      {loading ? <p>Loading...</p> : null}

      {!loading && hasToken ? (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: 16,
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
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
            <span>Excerpt</span>
            <textarea
              value={form.excerpt}
              onChange={(event) => updateField("excerpt", event.target.value)}
              rows={3}
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Content</span>
            <textarea
              value={form.content}
              onChange={(event) => updateField("content", event.target.value)}
              rows={10}
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Cover URL</span>
            <input
              value={form.cover_url}
              onChange={(event) => updateField("cover_url", event.target.value)}
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Upload image</span>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {resolveMediaUrl(form.cover_url) ? (
            <img
              src={resolveMediaUrl(form.cover_url)}
              alt="Cover preview"
              style={{
                width: "100%",
                maxWidth: 320,
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid #ddd",
              }}
            />
          ) : null}

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                style={{ padding: 10 }}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Category</span>
              <select
                value={form.category_id}
                onChange={(event) => updateField("category_id", event.target.value)}
                required
                style={{ padding: 10 }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Author</span>
              <select
                value={form.author_id}
                onChange={(event) => updateField("author_id", event.target.value)}
                required
                style={{ padding: 10 }}
              >
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Published at</span>
            <input
              type="datetime-local"
              value={form.published_at}
              onChange={(event) => updateField("published_at", event.target.value)}
              style={{ padding: 10, maxWidth: 280 }}
            />
          </label>

          <button type="submit" disabled={saving} style={{ width: "fit-content", padding: 12 }}>
            {saving ? "Saving..." : "Save article"}
          </button>
        </form>
      ) : null}
    </main>
  );
}
