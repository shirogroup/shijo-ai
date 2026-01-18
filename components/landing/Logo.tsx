// components/landing/Logo.tsx
export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle - represents global/search */}
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
      
      {/* Search magnifying glass */}
      <circle
        cx="13"
        cy="13"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
      />
      
      {/* Search handle */}
      <line
        x1="16.5"
        y1="16.5"
        x2="20"
        y2="20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* AI sparkle - top right */}
      <path
        d="M24 8L25 10L27 11L25 12L24 14L23 12L21 11L23 10L24 8Z"
        fill="currentColor"
        className="text-primary"
      />
      
      {/* AI sparkle - bottom left (smaller) */}
      <path
        d="M8 23L8.5 24L9.5 24.5L8.5 25L8 26L7.5 25L6.5 24.5L7.5 24L8 23Z"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
}
