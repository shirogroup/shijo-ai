"use client";

import { useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export function ModuleUpdatesForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [fax, setFax] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/learn/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, consent, fax }),
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !data?.success) {
        setStatus("error");
        setMessage(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("saved");
      setMessage("You're on the list. We'll write when Modules 2 and later are ready.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form
      className="relative rounded-xl border border-gray-200 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-base font-bold text-gray-900">Optional email for later modules</h2>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        Leave your email if you want a note when Modules 2 and later are published,
        and occasional SHIJO.AI tips. Every email includes a one-click unsubscribe link.
        This does not promise that an answer engine will name your business.
      </p>

      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="learn-fax">Fax</label>
        <input
          id="learn-fax"
          name="fax"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={fax}
          onChange={(e) => setFax(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="learn-name" className="block text-sm font-semibold text-gray-900 mb-1">
            Name <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <input
            id="learn-name"
            name="name"
            type="text"
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="learn-email" className="block text-sm font-semibold text-gray-900 mb-1">
            Email
          </label>
          <input
            id="learn-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Email me when Modules 2 and later are ready, and send occasional SHIJO.AI tips.
          Every email includes a one-click unsubscribe link.
        </span>
      </label>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center justify-center text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark disabled:opacity-60 text-white rounded-lg px-4 py-2.5 transition-colors"
        >
          {status === "saving" ? "Saving…" : "Send me updates"}
        </button>
      </div>

      {message ? (
        <p
          className={`mt-3 text-sm ${status === "error" ? "text-shiro-red" : "text-gray-700"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
