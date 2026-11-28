"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center border border-gray-300 hover:border-shiro-red text-gray-900 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
    >
      Print or save as PDF
    </button>
  );
}
