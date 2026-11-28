"use client";

import { useState } from "react";

type Status = "idle" | "saving" | "done" | "error";

export function UnsubscribeConfirm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function confirm() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/learn/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !data?.success) {
        setStatus("error");
        setMessage(data?.error || "We could not update that just now. Please try again in a little while.");
        return;
      }
      setStatus("done");
      setMessage("If this link was valid, that address is unsubscribed.");
    } catch {
      setStatus("error");
      setMessage("We could not update that just now. Please try again in a little while.");
    }
  }

  if (!token) {
    return (
      <p className="mt-4 text-sm text-gray-600">
        Open the unsubscribe link from the email. This page does not take an email address.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void confirm()}
        disabled={status === "saving" || status === "done"}
        className="inline-flex items-center justify-center text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark disabled:opacity-60 text-white rounded-lg px-4 py-2.5 transition-colors"
      >
        {status === "saving" ? "Updating…" : "Unsubscribe"}
      </button>
      {message ? (
        <p
          className={`mt-3 text-sm ${status === "error" ? "text-shiro-red" : "text-gray-700"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
