"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  apiRequest,
  clearAdminToken,
  getAdminToken,
  parseResponse,
  setAdminToken,
} from "./lib/admin-client";

type LoginResult = {
  token: string;
};

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoggedIn(Boolean(getAdminToken()));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await parseResponse<LoginResult>(res);
      setAdminToken(data.token);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setIsLoggedIn(false);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Admin panel</h1>

      {isLoggedIn ? (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 20,
            display: "grid",
            gap: 12,
          }}
        >
          <p style={{ margin: 0 }}>You are logged in.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/admin/articles">Manage articles</Link>
            <Link href="/admin/authors">Manage authors</Link>
            <Link href="/admin/categories">Manage categories</Link>
            <Link href="/admin/tags">Manage tags</Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{ width: "fit-content", padding: "10px 14px" }}
          >
            Log out
          </button>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid #ddd",
            borderRadius: 16,
            padding: 20,
            display: "grid",
            gap: 14,
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
              style={{ padding: 10 }}
            />
          </label>

          {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}

          <button type="submit" disabled={loading} style={{ padding: "10px 14px" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}
    </main>
  );
}
