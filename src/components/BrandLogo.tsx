interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 42, className = "" }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Genç Teknoloji"
      className={className}
    >
      <defs>
        <linearGradient id="gnc-logo-bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#004B93" />
          <stop offset="1" stopColor="#00A5DF" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#gnc-logo-bg)" stroke="#FFD100" strokeWidth="2.5" />
      <path d="M20 18h24v8H32v20h-8V26H20v-8z" fill="#FFD100" />
    </svg>
  );
}
