interface LogoProps {
  size?: number;
  className?: string;
}

// Brand colors from the actual logo
const BRAND_SLATE = '#5B6770';
const BRAND_SLATE_LIGHT = '#8899A6';
const BRAND_TEAL = '#14B8A6';

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer arc - large slate arc ~300 degrees, gap at top-left (around 10-11 o'clock) */}
      <path
        d="M 30 15 A 40 40 0 1 1 15 35"
        fill="none"
        stroke={BRAND_SLATE}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Middle arc - partial arc on right side, roughly 90 degrees */}
      <path
        d="M 65 25 A 28 28 0 0 1 78 50"
        fill="none"
        stroke={BRAND_SLATE_LIGHT}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Inner arc - teal accent at bottom-left, roughly 90 degrees */}
      <path
        d="M 25 60 A 20 20 0 0 0 40 78"
        fill="none"
        stroke={BRAND_TEAL}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Center dot - slate */}
      <circle cx="50" cy="50" r="10" fill={BRAND_SLATE} />

      {/* Small accent dot - teal, at 12 o'clock position on outer arc */}
      <circle cx="50" cy="10" r="5" fill={BRAND_TEAL} />
    </svg>
  );
}

export function LogoMark({ size = 24, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simplified for small sizes - same design, thicker strokes */}
      {/* Outer arc */}
      <path
        d="M 30 15 A 40 40 0 1 1 15 35"
        fill="none"
        stroke={BRAND_SLATE}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Inner teal arc */}
      <path
        d="M 25 60 A 20 20 0 0 0 40 78"
        fill="none"
        stroke={BRAND_TEAL}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="12" fill={BRAND_SLATE} />

      {/* Top accent dot */}
      <circle cx="50" cy="10" r="6" fill={BRAND_TEAL} />
    </svg>
  );
}

// For use in places where we want the logo with text
export function LogoWithText({ size = 32, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span
        className="font-semibold tracking-wide"
        style={{ color: BRAND_SLATE }}
      >
        TOKENCENTRIC
      </span>
    </div>
  );
}
