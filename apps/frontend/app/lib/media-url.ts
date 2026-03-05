function getApiOrigin() {
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!api) return "";

  return api.replace(/\/api\/?$/, "");
}

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) return "";

  if (/^(https?:|data:|blob:|\/\/)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    const origin = getApiOrigin();
    return origin ? `${origin}${url}` : url;
  }

  return url;
}
