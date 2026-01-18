import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shijo.ai - AI-Powered SEO & Keyword Research Platform",
  description: "Modern SEO platform combining traditional keyword research with AI search optimization. Track AI visibility, generate content briefs, and predict SEO opportunities.",
  keywords: "SEO, keyword research, AI search, AEO, content optimization, SERP analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
