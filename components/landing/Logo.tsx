interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`text-2xl font-bold ${className || ''}`}>
        SHIJO<span className="text-primary">.ai</span>
      </div>
    </div>
  );
}
