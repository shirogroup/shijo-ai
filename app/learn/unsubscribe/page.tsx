import type { Metadata } from "next";
import { UnsubscribeConfirm } from "@/components/learn/UnsubscribeConfirm";

export const metadata: Metadata = {
  title: "Unsubscribe | SHIJO.AI",
  description: "Unsubscribe from SHIJO.AI lesson emails with the link from the message.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://learn.shijo.ai/unsubscribe" },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : "";

  return (
    <main className="bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-bold text-shiro-red uppercase tracking-wide">SHIJO.AI</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">Unsubscribe</h1>
        <p className="text-lg text-gray-600">
          This stops lesson emails for the address tied to this link. One click confirms it.
          The page does not say whether that address was on the list.
        </p>
        <UnsubscribeConfirm token={token} />
      </article>
    </main>
  );
}
