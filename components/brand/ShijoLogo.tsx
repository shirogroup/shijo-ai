// components/brand/ShijoLogo.tsx
export function ShijoLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SHIJO.ai - AI-Powered SEO Platform"
    >
      {/* Outer circle representing global reach */}
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-primary"
        opacity="0.2"
      />
      
      {/* Search magnifying glass - SEO symbol */}
      <circle
        cx="20"
        cy="20"
        r="8"
        stroke="currentColor"
        strokeWidth="3"
        className="text-primary"
        fill="none"
      />
      
      {/* Magnifying glass handle */}
      <line
        x1="26"
        y1="26"
        x2="32"
        y2="32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* AI Neural network nodes */}
      <circle cx="20" cy="16" r="1.5" fill="currentColor" className="text-primary" />
      <circle cx="16" cy="20" r="1.5" fill="currentColor" className="text-primary" />
      <circle cx="24" cy="20" r="1.5" fill="currentColor" className="text-primary" />
      <circle cx="20" cy="24" r="1.5" fill="currentColor" className="text-primary" />
      
      {/* Neural connections */}
      <line x1="20" y1="16" x2="16" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity="0.4" />
      <line x1="20" y1="16" x2="24" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity="0.4" />
      <line x1="16" y1="20" x2="20" y2="24" stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity="0.4" />
      <line x1="24" y1="20" x2="20" y2="24" stroke="currentColor" strokeWidth="0.5" className="text-primary" opacity="0.4" />
      
      {/* AI Sparkle accent - top right */}
      <g transform="translate(34, 10)">
        <path
          d="M0-4L1-1L4,0L1,1L0,4L-1,1L-4,0L-1,-1Z"
          fill="currentColor"
          className="text-primary"
        />
      </g>
      
      {/* AI Sparkle accent - bottom left */}
      <g transform="translate(10, 36)">
        <path
          d="M0-3L0.7-0.7L3,0L0.7,0.7L0,3L-0.7,0.7L-3,0L-0.7,-0.7Z"
          fill="currentColor"
          className="text-primary"
          opacity="0.7"
        />
      </g>
      
      {/* Subtle gradient overlay for depth */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#logoGradient)" />
    </svg>
  );
}

// Horizontal logo with text
export function ShijoLogoFull({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ShijoLogo className="w-10 h-10" />
      <div className="flex items-baseline">
        <span className="text-2xl font-bold tracking-tight">SHIJO</span>
        <span className="text-2xl font-bold text-primary">.ai</span>
      </div>
    </div>
  );
}
