import type { Metadata } from "next";
import Header from "./ui/Header";

export const metadata: Metadata = {
  title: {
    default: "IT Blog",
    template: "%s | IT Blog",
  },
  description: "IT news and articles about programming, AI, DevOps and modern web.",

  // ВАЖЛИВО: постав прод-домен фронтенду
  metadataBase: new URL("https://romantic-nourishment-production-b446.up.railway.app"),

  verification: {
    google: "nluEGY-kniGdCZe1XPwb2R8elw2dFTI0267L0bSX42U",
  },

  openGraph: {
    title: "IT Blog",
    description: "IT news and articles about programming, AI, DevOps and modern web.",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "system-ui, Arial, sans-serif" }}>
        <Header />
        <div style={{ minHeight: "100vh" }}>{children}</div>
      </body>
    </html>
  );
}
