import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeoCheckCta } from "@/components/learn/GeoCheckCta";
import {
  GEO_CHECK_URL,
  LOG_PATH,
  META_GENERATOR_URL,
  VISIBILITY_LOG_DOWNLOAD,
} from "@/lib/learn/links";

/**
 * Free Module 1 of "Does AI Name Your Business?".
 *
 * The paid-course sales page (price, checkout, plan names) is intentionally
 * not published. Modules 2–6 are a short "coming later" note with no price.
 */

const title = "Module 1: Does AI Name Your Business? | SHIJO.AI";
const description =
  "Free Module 1. How a Google ranking differs from being named when a buyer asks an AI for a recommendation, with a Visibility Log and one free check.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://learn.shijo.ai" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: "https://learn.shijo.ai",
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

const labels: { label: string; meaning: string }[] = [
  {
    label: "Named",
    meaning: "Your brand is explicitly recommended or listed in the answer you received.",
  },
  {
    label: "Partial",
    meaning:
      "The category comes up, but only as a directory, a parent brand, or a vague “tools like…” — not you.",
  },
  {
    label: "Omitted",
    meaning: "The answer gives clear recommendations, and you are not among them.",
  },
  {
    label: "No answer",
    meaning: "The reply refuses, hedges, or gives generic advice with no brands.",
  },
];

export default function ModuleOnePage() {
  return (
    <main className="bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-xs font-bold text-shiro-red uppercase tracking-wide">
          Free · Module 1 · 10–15 min
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3">
          Does AI name your business?
        </h1>
        <p className="text-lg text-gray-600">
          Split: Google vs answers. One lab on your own site, written into a{" "}
          <Link href={LOG_PATH} className="text-shiro-red hover:underline">
            Visibility Log
          </Link>
          . The lab ends in the free check at{" "}
          <a href={GEO_CHECK_URL} className="text-shiro-red hover:underline">
            shijo.ai/geo
          </a>
          .
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href={GEO_CHECK_URL}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-shiro-red hover:bg-shiro-red-dark text-white rounded-lg px-4 py-2.5 transition-colors"
          >
            Run the free AI visibility check
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <Link
            href={LOG_PATH}
            className="inline-flex items-center justify-center text-sm font-semibold border border-gray-300 hover:border-shiro-red text-gray-900 rounded-lg px-4 py-2.5 transition-colors"
          >
            Open the Visibility Log
          </Link>
        </div>

        <section id="goal" className="mt-10 bg-accent rounded-xl p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Learning goal</h2>
          <p className="text-gray-700 leading-relaxed">
            By the end of this module you can explain, in plain owner language, how
            “showing up on Google” is different from “showing up when someone asks
            an AI for a recommendation” — and you will have a filled Visibility Log
            for your brand as the baseline for later modules.
          </p>
        </section>

        <section id="two-jobs" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Two different jobs</h2>
          <h3 className="font-semibold text-gray-900 mb-1">Google’s classic job</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Match a query to pages. Rankings, titles, links, and on-page relevance
            still matter. You already know this game if you have done SEO at all.
          </p>
          <h3 className="font-semibold text-gray-900 mb-1">An answer engine’s job</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Synthesize a short answer and often name a brand, or leave it out.
            Answer engines lean on clear claims, FAQ-shaped content, comparisons,
            and mentions across the web — not only on who ranks #1 for a keyword
            today.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Same buyer. Different output. A site can rank and still not be named
            in an answer. A page that is thin in classic SEO can sometimes be
            drawn on when it answers the question in plain language. This module
            does not promise you will be cited. Most owners only measure the
            first job.
          </p>
          <p className="text-gray-700 leading-relaxed">
            You are not abandoning Google. You are adding a second scoreboard:
            are you named when a buyer asks in conversational language?
          </p>
        </section>

        <section id="example" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            2. Owner example (Dallas / Toronto / Calgary)
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Imagine you run a B2B service used by clinics. The prompts below show
            how a buyer might ask. They are not results, and they are not a claim
            that any engine named or missed a business.
          </p>
          <h3 className="font-semibold text-gray-900 mb-1">Google-shaped query</h3>
          <p className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-2">
            payroll software small clinic Texas
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            You check rankings. Maybe you appear. You feel fine.
          </p>
          <h3 className="font-semibold text-gray-900 mb-2">Answer-shaped prompts</h3>
          <ul className="list-disc pl-6 space-y-1.5 text-gray-700 mb-4">
            <li>What’s the best payroll tool for a small clinic in Dallas?</li>
            <li>
              Who should a Calgary dental office use for bookkeeping that works
              with Canadian payroll?
            </li>
            <li>Compare [You] vs [Rival] for a Toronto team of 12.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Those prompts are how busy buyers talk to AI. Your Module 1 job is
            not to optimize for a vendor. It is to record what you see when
            prompts like these are asked about your category — and whether your
            brand appears in the answer you got.
          </p>
        </section>

        <section id="named" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            3. What “named” means in this course
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Use these labels in your Visibility Log. They describe what you see
            when you ask. They are your notes. SHIJO.AI is not reporting that an
            engine named or missed a specific business.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold border-b border-gray-200 w-32">
                    Label
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold border-b border-gray-200">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {labels.map((row) => (
                  <tr key={row.label} className="align-top">
                    <th scope="row" className="px-3 py-2 font-semibold border-b border-gray-200 text-left">
                      {row.label}
                    </th>
                    <td className="px-3 py-2 border-b border-gray-200 text-gray-700">
                      {row.meaning}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed mt-4">
            Partial and Omitted are both gaps. “No answer” is a different gap
            (thin category evidence online). Later modules treat those gap types
            differently. Module 1 only logs them.
          </p>
        </section>

        <section id="claims" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. What we do not claim</h2>
          <ul className="list-disc pl-6 space-y-1.5 text-gray-700">
            <li>We do not promise you will be named, in 30 days or ever.</li>
            <li>We do not teach ranking systems as the goal.</li>
            <li>We do not put AI vendor names on ads or course pages.</li>
            <li>We do not give legal, medical, or finance advice.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Your proof of progress is an improving Visibility Log and a finished
            lab — not a screenshot of one temporary chat.
          </p>
        </section>

        <section id="shijo" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            5. Where SHIJO.AI fits in Module 1
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            After you fill the log, run one SHIJO.AI action so the lab is tied
            to your site:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>
              Open the{" "}
              <a href={GEO_CHECK_URL} className="text-shiro-red hover:underline">
                free AI visibility check
              </a>{" "}
              with your business name and the page you care about most.
            </li>
            <li>
              The check is a directional signal at one moment. Write the date
              and one takeaway in the log. A signed-in consumer chat is
              personalised and changes over time. The check does not guarantee
              a mention.
            </li>
            <li>
              The check does not audit title tags. If you already know the title
              or meta description on that page is weak, you can optionally draft
              a replacement in{" "}
              <a href={META_GENERATOR_URL} className="text-shiro-red hover:underline">
                SEO Meta Generator
              </a>
              . That tool is free inside the dashboard and needs an account.
              Save the draft. Publish it only if you already planned to.
              Publishing can wait.
            </li>
          </ol>
          <p className="text-gray-700 leading-relaxed mt-4">
            The log is the file you keep. The check is the action that ties the
            lesson to your stack.
          </p>
        </section>

        <section id="lab" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Lab — your Visibility Log (do this today)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            About 20–30 minutes once, then 10 minutes when you refresh it later.
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>
              Open the{" "}
              <Link href={LOG_PATH} className="text-shiro-red hover:underline">
                Visibility Log
              </Link>{" "}
              and{" "}
              <a
                href={VISIBILITY_LOG_DOWNLOAD}
                download="visibility-log.md"
                className="text-shiro-red hover:underline"
              >
                download the worksheet
              </a>
              , or print the page.
            </li>
            <li>
              Write your brand name, primary URL, category in buyer words, and
              home markets (for example US — Texas; Canada — Ontario / Alberta).
            </li>
            <li>
              Add 8 prompts in real buyer language:
              <ul className="list-disc pl-6 mt-1.5 space-y-1">
                <li>3 “best / who should I…” prompts</li>
                <li>2 “near me / city” prompts (your cities)</li>
                <li>2 “[you] vs [rival]” or “alternatives to [rival]” prompts</li>
                <li>1 “for [specific niche]” prompt</li>
              </ul>
            </li>
            <li>
              For each prompt, ask in the answer tools you already use as a
              buyer (or have a teammate ask). Record Named, Partial, Omitted,
              or No answer; who got named; and a one-line note.
            </li>
            <li>Mark the top 3 gaps you care about this month.</li>
            <li>
              Run the{" "}
              <a href={GEO_CHECK_URL} className="text-shiro-red hover:underline">
                free check
              </a>{" "}
              on your primary URL. Paste the date and one takeaway into the
              log’s SHIJO.AI row.
            </li>
            <li>
              Optional: if you already know the title or meta is weak, draft one
              fix in SEO Meta Generator and note it in the log. Do not publish
              unless you already planned to.
            </li>
          </ol>
          <p className="text-gray-700 leading-relaxed mt-4">
            Done when eight rows are filled, three gaps are starred, and the
            check is dated. Keep the file where you will find it for the next
            module.
          </p>
        </section>

        <section id="exit" className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Exit check (60 seconds)</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            Answer in one sentence each:
          </p>
          <ol className="list-decimal pl-6 space-y-1.5 text-gray-700">
            <li>How is “ranking” different from “being named in an answer”?</li>
            <li>Which of your eight prompts hurt the most, and why?</li>
            <li>What did the free check show that you did not already know?</li>
          </ol>
          <p className="text-gray-700 leading-relaxed mt-4">
            If you can answer those, Module 1 is complete. Later modules build
            a prompt bank so you stop guessing which questions matter.
          </p>
        </section>

        <aside className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-base font-bold text-gray-900">Modules 2–6 come later</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            This free module is the baseline. Later modules cover a prompt bank,
            pages that answer buyer questions in plain language, mentions, a gap
            list, and a short repeat loop. There is no checkout on this page.
          </p>
        </aside>

        <div className="mt-10">
          <GeoCheckCta
            heading="Ready for the lab’s one SHIJO.AI action?"
            body="Run the free check, then write the date and one takeaway in your Visibility Log. Nothing here promises you will be named."
          />
        </div>
      </article>
    </main>
  );
}
