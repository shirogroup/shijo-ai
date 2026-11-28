import { LearnChrome } from "@/components/learn/LearnChrome";

/**
 * Public organization name is SHIJO.AI, matching the publisher on /geo.
 * The legal entity is not the name of this node.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SHIJO.AI",
  url: "https://www.shijo.ai",
  logo: "https://www.shijo.ai/brand/shijo-logo-square-1200.png",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <LearnChrome>{children}</LearnChrome>
    </>
  );
}
