interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="256" cy="256" r="240" fill="url(#logoGrad1)" />

      {/* Inner ring */}
      <circle
        cx="256"
        cy="256"
        r="180"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="8"
      />

      {/* Document shape */}
      <rect x="160" y="120" width="192" height="240" rx="16" fill="white" />

      {/* Document fold */}
      <path d="M304 120 L352 168 L304 168 Z" fill="#E5E7EB" />

      {/* Token lines */}
      <rect x="192" y="180" width="80" height="12" rx="4" fill="url(#logoGrad2)" />
      <rect x="192" y="208" width="128" height="12" rx="4" fill="#CBD5E1" />
      <rect x="192" y="236" width="100" height="12" rx="4" fill="#CBD5E1" />
      <rect x="192" y="264" width="64" height="12" rx="4" fill="url(#logoGrad2)" />
      <rect x="192" y="292" width="112" height="12" rx="4" fill="#CBD5E1" />
      <rect x="192" y="320" width="88" height="12" rx="4" fill="#CBD5E1" />

      {/* Token count badge */}
      <circle cx="352" cy="360" r="48" fill="white" />
      <circle cx="352" cy="360" r="40" fill="url(#logoGrad1)" />
      <text
        x="352"
        y="368"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        T
      </text>
    </svg>
  );
}

export function LogoMark({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="markGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="240" fill="url(#markGrad)" />
      <circle
        cx="256"
        cy="256"
        r="180"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="12"
      />
      <text
        x="256"
        y="290"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="180"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        T
      </text>
    </svg>
  );
}
