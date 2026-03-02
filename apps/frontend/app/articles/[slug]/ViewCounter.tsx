"use client";

import { useEffect, useState } from "react";

const VIEW_TTL_MS = 60 * 60 * 1000;

type ViewCounterProps = {
  slug: string;
  initialViews: number;
};

export default function ViewCounter({ slug, initialViews }: ViewCounterProps) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    setViews(initialViews);
  }, [initialViews, slug]);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return;

    const storageKey = `article:view:${slug}`;
    let shouldTrack = true;

    try {
      const lastViewed = Number(window.localStorage.getItem(storageKey) || "0");
      if (lastViewed && Date.now() - lastViewed < VIEW_TTL_MS) {
        shouldTrack = false;
      } else {
        window.localStorage.setItem(storageKey, String(Date.now()));
      }
    } catch {
      shouldTrack = true;
    }

    if (!shouldTrack) return;

    let cancelled = false;

    const trackView = async () => {
      try {
        const res = await fetch(`${api}/articles/${slug}/view`, {
          method: "POST",
        });
        if (!res.ok) {
          throw new Error("Failed to track view");
        }

        const json = await res.json();
        const nextViews = Number(json.data?.views);
        if (!cancelled && Number.isFinite(nextViews)) {
          setViews(nextViews);
        }
      } catch {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {}
      }
    };

    trackView();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <small style={{ display: "block", opacity: 0.8, marginBottom: 16 }}>
      {views} views
    </small>
  );
}
