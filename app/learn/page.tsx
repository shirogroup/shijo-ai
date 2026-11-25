import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Free Training Coming Soon | SHIJO.ai",
  description: "Free training from SHIJO.ai is coming soon.",
  alternates: { canonical: "https://learn.shijo.ai" },
  openGraph: {
    title: "Free Training Coming Soon | SHIJO.ai",
    description: "Free training from SHIJO.ai is coming soon.",
    url: "https://learn.shijo.ai",
    siteName: "SHIJO.ai",
    locale: "en_US",
    type: "website",
  },
};

export default function LearnLandingPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-xl">
        <div className="flex items-center gap-3 mb-10">
          <LogoMark className="w-10 h-10" />
          <span className="text-2xl font-bold tracking-tight">SHIJO.ai</span>
        </div>
        <p className="text-2xl sm:text-3xl font-medium text-white/90 mb-10">
          Free training is coming soon.
        </p>
        <a
          href="https://www.shijo.ai"
          className="inline-flex items-center justify-center bg-shiro-red hover:bg-shiro-red-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Visit SHIJO.ai
        </a>
      </div>
    </main>
  );
}
