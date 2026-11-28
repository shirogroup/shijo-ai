import { ArrowRight } from "lucide-react";
import { GEO_CHECK_URL } from "@/lib/learn/links";

export function GeoCheckCta({
  heading = "Run the free AI visibility check",
  body = "Open shijo.ai/geo with your business name and the page you care about. No account. The result is a directional signal at one moment.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <div className="bg-shiro-black text-white rounded-2xl p-6 print:hidden">
      <p className="font-semibold mb-1">{heading}</p>
      <p className="text-sm text-gray-300 mb-5">{body}</p>
      <a
        href={GEO_CHECK_URL}
        className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors"
      >
        Run the free check <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
