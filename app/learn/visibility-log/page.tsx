import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GeoCheckCta } from "@/components/learn/GeoCheckCta";
import { PrintButton } from "@/components/learn/PrintButton";
import {
  GEO_CHECK_URL,
  META_GENERATOR_URL,
  MODULE_PATH,
  VISIBILITY_LOG_DOWNLOAD,
} from "@/lib/learn/links";

const title = "Visibility Log | Does AI Name Your Business? | SHIJO.AI";
const description =
  "Module 1 worksheet. Log eight buyer prompts, mark three gaps, and record one free SHIJO.AI visibility check. Print it or download the file.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://learn.shijo.ai/visibility-log" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: "https://learn.shijo.ai/visibility-log",
    siteName: "SHIJO.AI",
    locale: "en_US",
    type: "article",
    images: [
      {
        url: "/brand/shijo-logo-landscape-1200x300.png",
        width: 1200,
        height: 300,
        alt: "SHIJO.AI",
      },
    ],
  },
};

const promptRows: { n: number; type: string }[] = [
  { n: 1, type: "Best / who" },
  { n: 2, type: "Best / who" },
  { n: 3, type: "Best / who" },
  { n: 4, type: "City / local" },
  { n: 5, type: "City / local" },
  { n: 6, type: "Vs / alternatives" },
  { n: 7, type: "Vs / alternatives" },
  { n: 8, type: "Niche" },
];

function BlankLine() {
  return (
    <span className="block border-b border-gray-300 min-h-8 mt-1" aria-hidden="true" />
  );
}

export default function VisibilityLogPage() {
  return (
    <main className="bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href={MODULE_PATH}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-shiro-red mb-8 transition-colors print:hidden"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to Module 1
        </Link>

        <p className="text-xs font-bold text-shiro-red uppercase tracking-wide">
          Course file · Module 1
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">
          Visibility Log
        </h1>
        <p className="text-lg text-gray-600">
          Does AI name your business? This is the scoreboard you keep. A single
          chat is not proof you will be named.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 print:hidden">
          <a
            href={VISIBILITY_LOG_DOWNLOAD}
            download="visibility-log.md"
            className="inline-flex items-center justify-center text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors"
          >
            Download worksheet (.md)
          </a>
          <PrintButton />
          <a
            href={GEO_CHECK_URL}
            className="inline-flex items-center justify-center text-sm font-semibold border border-gray-300 hover:border-shiro-red text-gray-900 rounded-lg px-4 py-2.5 transition-colors"
          >
            Run the free check
          </a>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Your details</h2>
          <dl className="text-sm">
            {[
              "Owner",
              "Brand / product name",
              "Primary URL",
              "Category (buyer words)",
              "Cities / regions",
              "Log started",
              "Last refresh",
            ].map((label) => (
              <div key={label} className="py-2 border-b border-gray-200">
                <dt className="font-semibold text-gray-900">{label}</dt>
                <dd>
                  <BlankLine />
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-gray-800">
            Markets: ☐ USA &nbsp;&nbsp; ☐ Canada
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">How to use</h2>
          <ol className="list-decimal pl-6 space-y-1.5 text-gray-700">
            <li>Write prompts the way a busy buyer talks — not keyword stuffing.</li>
            <li>For each prompt, record what an answer engine actually returns today, in a tool you already use.</li>
            <li>
              Labels: Named, Partial, Omitted, No answer. Definitions are in{" "}
              <Link href={`${MODULE_PATH}#named`} className="text-shiro-red hover:underline">
                Module 1
              </Link>
              . The labels are your notes.
            </li>
            <li>Star the three gaps you will attack first.</li>
            <li>Refresh this log after later modules — same prompts, new date if you need one.</li>
          </ol>
          <p className="text-gray-700 leading-relaxed mt-4">
            Do not treat a single chat as proof forever. This log is your scoreboard.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Prompt table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 min-w-[40rem]">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["#", "Prompt (buyer language)", "Type", "Result", "Who got named", "Gap note", "★"].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="px-2 py-2 font-semibold border-b border-gray-200 whitespace-nowrap"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {promptRows.map((row) => (
                  <tr key={row.n} className="break-inside-avoid">
                    <th scope="row" className="px-2 py-4 border-b border-gray-200 text-left font-semibold">
                      {row.n}
                    </th>
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200 text-gray-600 whitespace-nowrap">
                      {row.type}
                    </td>
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Type key: Best / who · City / local · Vs / alternatives · Niche.
            Result key: Named · Partial · Omitted · No answer.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Top 3 gaps this month</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 min-w-[32rem]">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["Rank", "Prompt #", "Why it hurts the business", "First fix later (leave blank in Module 1)"].map(
                    (heading) => (
                      <th key={heading} scope="col" className="px-2 py-2 font-semibold border-b border-gray-200">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((rank) => (
                  <tr key={rank}>
                    <th scope="row" className="px-2 py-4 border-b border-gray-200 text-left">
                      {rank}
                    </th>
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Rivals named more than you (quick list)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Write names you personally saw in an answer. Leave the row blank if
            you have nothing to record.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["Rival / directory", "Where they showed up (prompt #s)", "Notes"].map((heading) => (
                    <th key={heading} scope="col" className="px-2 py-2 font-semibold border-b border-gray-200">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">SHIJO.AI lab row (required)</h2>
          <dl className="text-sm border border-gray-200 rounded-xl overflow-hidden">
            {[
              "Date of the free check",
              "URL checked",
              "One takeaway from the check",
            ].map((label) => (
              <div key={label} className="px-4 py-3 border-b border-gray-200">
                <dt className="font-semibold text-gray-900">{label}</dt>
                <dd>
                  <BlankLine />
                </dd>
              </div>
            ))}
            <div className="px-4 py-3 border-b border-gray-200">
              <dt className="font-semibold text-gray-900">SEO Meta Generator draft? (optional)</dt>
              <dd className="mt-1 text-gray-700">
                ☐ No &nbsp;&nbsp; ☐ Yes — link or notes:
                <BlankLine />
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="font-semibold text-gray-900">Published anything live today?</dt>
              <dd className="mt-1 text-gray-700">
                ☐ No &nbsp;&nbsp; ☐ Yes (only if you already planned to)
              </dd>
            </div>
          </dl>
          <p className="text-sm text-gray-600 mt-3">
            Run the check at{" "}
            <a href={GEO_CHECK_URL} className="text-shiro-red hover:underline">
              shijo.ai/geo
            </a>
            . The optional draft tool is{" "}
            <a href={META_GENERATOR_URL} className="text-shiro-red hover:underline">
              SEO Meta Generator
            </a>
            , which needs a free account. The check does not audit title tags,
            and it does not promise a mention.
          </p>
        </section>

        <aside className="mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
          <h2 className="text-base font-bold text-gray-900">
            Sample row — teaching only
          </h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            This shows how to fill a row. It is not a recorded result, it is
            not about a real business, and it is not a SHIJO.AI finding.
            Replace it with what you actually see.
          </p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border border-gray-200 bg-white min-w-[40rem]">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["#", "Prompt", "Type", "Result", "Who got named", "Gap note", "★"].map((heading) => (
                    <th key={heading} scope="col" className="px-2 py-2 font-semibold border-b border-gray-200">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-2 border-b border-gray-200">1</td>
                  <td className="px-2 py-2 border-b border-gray-200">
                    best payroll software for small clinics in Dallas
                  </td>
                  <td className="px-2 py-2 border-b border-gray-200">Best / who</td>
                  <td className="px-2 py-2 border-b border-gray-200">Omitted (example)</td>
                  <td className="px-2 py-2 border-b border-gray-200">Competitor A, Competitor B (placeholders)</td>
                  <td className="px-2 py-2 border-b border-gray-200">
                    No clinic-specific page; homepage is generic
                  </td>
                  <td className="px-2 py-2 border-b border-gray-200">★</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Refresh log (later modules)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 min-w-[32rem]">
              <thead className="bg-gray-50 text-left">
                <tr>
                  {["Date", "Prompts re-checked (list #s)", "What improved", "What did not"].map((heading) => (
                    <th key={heading} scope="col" className="px-2 py-2 font-semibold border-b border-gray-200">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1].map((i) => (
                  <tr key={i}>
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                    <td className="px-2 py-4 border-b border-gray-200" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Reminder</h2>
          <p className="text-gray-700 leading-relaxed">
            The scoreboard for this module is this log. It is not a rankings
            screenshot, and it is not a promise that you will be named.
          </p>
        </section>

        <div className="mt-10">
          <GeoCheckCta body="When the eight rows and three gaps are filled, run one free check and write the date plus one takeaway in the lab row above." />
        </div>
      </article>
    </main>
  );
}
