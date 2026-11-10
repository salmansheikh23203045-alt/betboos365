/* Custom SVG icons for the hero shortcut buttons. Hand-drawn to match the TCL11
 * reference (golden-white glowing line icons). Not Lucide. Each icon inherits its
 * colour from `currentColor` (set to gold by the button) and gets its glow from a
 * CSS drop-shadow filter applied by ShortcutGrid. */

type IconProps = { className?: string; style?: React.CSSProperties };

const COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HomeIcon({ className, style }: IconProps) {
  return (
    <svg {...COMMON} className={className} style={style} aria-hidden="true">
      <path d="M3.2 11.4 12 4l8.8 7.4" />
      <path d="M5.4 10.1V19.4H18.6V10.1" />
      <path d="M9.9 19.4v-4.2a2.1 2.1 0 0 1 4.2 0v4.2" />
      <path d="M15.9 7.2V5.2h2V8.4" />
    </svg>
  );
}

export function HistoryIcon({ className, style }: IconProps) {
  return (
    <svg {...COMMON} className={className} style={style} aria-hidden="true">
      <path d="M7 3.4h7a1 1 0 0 1 .7.3l2.3 2.3a1 1 0 0 1 .3.7V13.4" />
      <path d="M17.3 13.4V13.4M6 4.4a1 1 0 0 1 1-1" />
      <path d="M6 4.4V14a1 1 0 0 0 1 1h5.1" />
      <path d="M8.8 7.3h5.6M8.8 9.7h5.6M8.8 12.1h3" />
      <circle cx="14.6" cy="14.6" r="2.5" />
      <path d="m16.5 16.5 2.6 2.6" />
    </svg>
  );
}

export function BonusIcon({ className, style }: IconProps) {
  return (
    <svg {...COMMON} className={className} style={style} aria-hidden="true">
      <path d="M4.9 10.6h14.2V19a1 1 0 0 1-1 1H5.9a1 1 0 0 1-1-1v-8.4Z" />
      <path d="M3.8 7.7h16.4v2.9H3.8z" />
      <path d="M12 7.7V20" />
      <path d="M12 7.7C10.8 5 7 4.9 7.5 7.1c.3 1.4 3 .7 4.5.6Z" />
      <path d="M12 7.7C13.2 5 17 4.9 16.5 7.1c-.3 1.4-3 .7-4.5.6Z" />
    </svg>
  );
}

export function LiveChatIcon({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M4 4.6h16.5a2 2 0 0 1 2 2v6.6a2 2 0 0 1-2 2h-8.3l-4 3a.5.5 0 0 1-.8-.4v-2.6H4a2 2 0 0 1-2-2V6.6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="12.2"
        y="11.7"
        textAnchor="middle"
        fontSize="5.6"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill="currentColor"
        stroke="none"
      >
        DHF
      </text>
      <circle cx="21.6" cy="4.9" r="1.9" fill="#ff1f1f" stroke="none" />
    </svg>
  );
}

export function VipIcon({ className, style }: IconProps) {
  return (
    <svg {...COMMON} className={className} style={style} aria-hidden="true">
      <path d="M4 17 5.5 9l4 4.6L12 6.6l2.5 7L18.5 9 20 17Z" />
      <path d="M4.5 19.7h15" />
      <circle cx="5.5" cy="7.7" r="0.95" fill="currentColor" />
      <circle cx="12" cy="5.3" r="0.95" fill="currentColor" />
      <circle cx="18.5" cy="7.7" r="0.95" fill="currentColor" />
    </svg>
  );
}

/* Parametric 8-tooth gear path (computed once). */
const GEAR_PATH = (() => {
  const teeth = 8;
  const cx = 12;
  const cy = 12;
  const rOut = 10.2;
  const rVal = 7.6;
  const step = (Math.PI * 2) / teeth;
  const half = step * 0.26;
  const ease = (step / 2 - half) * 0.55;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < teeth; i++) {
    const a = -Math.PI / 2 + i * step;
    pts.push([a - half, rOut]);
    pts.push([a + half, rOut]);
    pts.push([a + half + ease, rVal]);
    pts.push([a + step - half - ease, rVal]);
  }
  return (
    pts
      .map(([ang, r], idx) => {
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ") + " Z"
  );
})();

export function SettingIcon({ className, style }: IconProps) {
  return (
    <svg {...COMMON} className={className} style={style} aria-hidden="true">
      <path d={GEAR_PATH} />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export const SHORTCUT_ICONS: Record<
  string,
  (p: IconProps) => React.ReactElement
> = {
  home: HomeIcon,
  history: HistoryIcon,
  bonus: BonusIcon,
  "live-chat": LiveChatIcon,
  vip: VipIcon,
  setting: SettingIcon,
};
