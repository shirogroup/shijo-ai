import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SHIJO.AI - AI-Powered SEO Tools | Keyword Research & AI Search Visibility",
  description: "Track your visibility in ChatGPT, Claude & Perplexity. AI-powered keyword research, content optimization, and SERP analysis in one platform.",
  keywords: "SEO tools, AI search, keyword research, SERP analysis, content optimization, ChatGPT visibility, Claude AI, Perplexity",
  openGraph: {
    title: "SHIJO.AI - AI-Powered SEO Tools",
    description: "Track your visibility in ChatGPT, Claude & Perplexity. AI-powered keyword research, content optimization, and SERP analysis.",
    url: "https://shijo.ai",
    siteName: "SHIJO.AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHIJO.AI - AI-Powered SEO Tools",
    description: "AI-powered keyword research and search visibility tracking",
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
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
