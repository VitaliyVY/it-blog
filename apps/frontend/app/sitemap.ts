import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const api = process.env.NEXT_PUBLIC_API_URL!;

  // отримуємо статті
  const res = await fetch(`${api}/articles`, { cache: "no-store" });
  const json = await res.json();
  const articles = json.data ?? [];

  const articleUrls = articles.map((a: any) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: a.published_at || new Date(),
  }));

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/categories`, lastModified: new Date() },
    { url: `${base}/tags`, lastModified: new Date() },
    { url: `${base}/authors`, lastModified: new Date() },
    ...articleUrls,
  ];
}