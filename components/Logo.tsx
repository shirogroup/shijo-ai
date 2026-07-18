import Link from 'next/link';

// The one canonical SHIJO.AI logo mark — a stacked-diamond icon in the
// brand red. This was previously only used on the homepage header and auth
// pages (login/register/forgot-password/reset-password), while the
// legal-pages Header/Footer used a different, unrelated gradient "S"
// square, and a third, entirely unused logo design sat dead in
// components/brand/ShijoLogo.tsx. Consolidated to this single mark
// (2026-07-18) so every page — marketing, legal, blog, auth — shows the
// same logo, and the favicon (app/icon.svg, app/apple-icon.svg) is
// generated from this exact same shape.
export function LogoMark({ className = 'w-8 h-8', stroke = '#DC0019' }: { className?: string; stroke?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17L12 22L22 17" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12L12 17L22 12" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({
  href = '/',
  iconClassName = 'w-8 h-8',
  textClassName = 'text-xl font-bold text-shiro-red',
  showText = true,
}: {
  href?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <LogoMark className={iconClassName} />
      {showText && <span className={textClassName}>SHIJO.AI</span>}
    </Link>
  );
}
