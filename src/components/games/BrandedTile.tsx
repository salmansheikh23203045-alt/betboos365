import { cn } from "@/lib/cn";
import { gameAccent } from "@/lib/gameArt";

/**
 * BrandedTile — fallback artwork that reads as intentional casino art, not
 * a placeholder. Dark base, gold starburst, red glow, large initial, ultra-
 * compact title. Matches the TCL palette and fills every corner of the
 * parent — no "Asset pending" text, no blank box.
 *
 * Used when a GameCard has no explicit artSrc and the central gameArt map
 * has no mapping either. Keeps every tile visually finished.
 */
export function BrandedTile({
  title,
  gameId,
  className,
}: {
  title: string;
  gameId: string;
  className?: string;
}) {
  const accent = gameAccent(gameId);
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <radialGradient id={`bt-rad-${gameId}`} cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor={accent.from} stopOpacity="0.9" />
            <stop offset="55%" stopColor={accent.to} stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1a0505" stopOpacity="1" />
          </radialGradient>
          <linearGradient id={`bt-gold-${gameId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6d968" />
            <stop offset="50%" stopColor="#f1bf3d" />
            <stop offset="100%" stopColor="#b7892a" />
          </linearGradient>
          <filter id={`bt-glow-${gameId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base */}
        <rect width="160" height="100" fill={`url(#bt-rad-${gameId})`} />

        {/* Diagonal shimmer lines */}
        <g opacity="0.12" stroke="#f1bf3d" strokeWidth="0.5">
          <line x1="-20" y1="20" x2="200" y2="-20" />
          <line x1="-20" y1="60" x2="200" y2="20" />
          <line x1="-20" y1="110" x2="200" y2="60" />
        </g>

        {/* Starburst */}
        <g
          transform="translate(80 48)"
          opacity="0.28"
          stroke={`url(#bt-gold-${gameId})`}
          strokeWidth="1"
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const x = Math.cos(a) * 60;
            const y = Math.sin(a) * 60;
            return <line key={i} x1="0" y1="0" x2={x} y2={y} />;
          })}
        </g>

        {/* Center medallion */}
        <circle
          cx="80"
          cy="48"
          r="26"
          fill="#0a0a0a"
          stroke={`url(#bt-gold-${gameId})`}
          strokeWidth="2"
          filter={`url(#bt-glow-${gameId})`}
        />
        <text
          x="80"
          y="56"
          textAnchor="middle"
          fontSize="26"
          fontFamily="var(--font-anton, sans-serif)"
          fontWeight="700"
          fill={`url(#bt-gold-${gameId})`}
        >
          {initial}
        </text>

        {/* Bottom red strip for depth */}
        <rect y="88" width="160" height="12" fill="#1a0404" opacity="0.65" />
      </svg>
    </div>
  );
}
