"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SHORTCUT_ICONS } from "@/components/home/ShortcutIcons";

export interface ShortcutItem {
  id: string;
  label: string;
  href: string;
}

export const SHORTCUTS: ShortcutItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "history", label: "History", href: "/history" },
  { id: "bonus", label: "Bonus", href: "/promotion" },
  { id: "live-chat", label: "Live Chat", href: "/chat" },
  { id: "vip", label: "VIP", href: "/vip" },
  { id: "setting", label: "Setting", href: "/settings" },
];

/* ── Casino-style particle burst (click) ── */
type Shape = "star" | "circle" | "diamond" | "square" | "crown";

interface ParticleConfig {
  colors: string[];
  shapes: Shape[];
  glow: string;
}

const PARTICLES: Record<string, ParticleConfig> = {
  home: { colors: ["#ffc21a", "#ffe27a", "#ff8c00"], shapes: ["star", "circle", "star"], glow: "#ffc21a" },
  history: { colors: ["#e10f0f", "#ffc21a", "#fff"], shapes: ["circle", "diamond", "square"], glow: "#e10f0f" },
  bonus: { colors: ["#e10f0f", "#ffc21a", "#ff2a2a", "#ffe27a"], shapes: ["star", "diamond", "circle", "square"], glow: "#ffc21a" },
  "live-chat": { colors: ["#ffc21a", "#fff", "#e10f0f"], shapes: ["circle", "star", "square"], glow: "#fff" },
  vip: { colors: ["#ffc21a", "#ffe27a", "#c98a00", "#fff"], shapes: ["crown", "star", "crown", "square"], glow: "#ffc21a" },
  setting: { colors: ["#e10f0f", "#ffc21a", "#9a9a9a", "#fff"], shapes: ["circle", "diamond", "square"], glow: "#e10f0f" },
};

const STAR_CLIP = "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";
const DIAMOND_CLIP = "polygon(50% 0%,100% 50%,50% 100%,0% 50%)";
const CROWN_CLIP = "polygon(0% 100%,0% 35%,25% 60%,50% 10%,75% 60%,100% 35%,100% 100%)";

function clipFor(shape: Shape): string {
  if (shape === "star") return STAR_CLIP;
  if (shape === "diamond") return DIAMOND_CLIP;
  if (shape === "crown") return CROWN_CLIP;
  return "none";
}

function burst(cx: number, cy: number, identity: string) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const cfg = PARTICLES[identity] ?? PARTICLES.home;
  const count = 18 + Math.floor(Math.random() * 6);

  // Neon shockwave ring
  const ring = document.createElement("div");
  Object.assign(ring.style, {
    position: "fixed",
    left: `${cx}px`,
    top: `${cy}px`,
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    border: `2px solid ${cfg.glow}`,
    transform: "translate(-50%,-50%)",
    pointerEvents: "none",
    zIndex: "9998",
    boxShadow: `0 0 14px 2px ${cfg.glow}`,
  });
  document.body.appendChild(ring);
  ring.animate(
    [
      { width: "10px", height: "10px", opacity: 1, borderWidth: "3px" },
      { width: "130px", height: "130px", opacity: 0, borderWidth: "1px" },
    ],
    { duration: 520, easing: "ease-out", fill: "forwards" },
  );
  setTimeout(() => ring.remove(), 560);

  // Particles
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const color = cfg.colors[i % cfg.colors.length];
    const shape = cfg.shapes[i % cfg.shapes.length];
    const size = 6 + Math.random() * 8;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const dist = 42 + Math.random() * 72;
    const dur = 650 + Math.random() * 250; // 650-900ms
    const rotation = Math.random() * 540 - 270;

    Object.assign(p.style, {
      position: "fixed",
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: shape === "circle" ? "50%" : "1px",
      clipPath: clipFor(shape),
      pointerEvents: "none",
      zIndex: "9999",
      boxShadow: `0 0 ${size + 4}px ${size / 2}px ${color}bb`,
    });
    document.body.appendChild(p);

    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 32; // bias upward

    p.animate(
      [
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.15) rotate(${rotation}deg)`,
          opacity: 0,
        },
      ],
      { duration: dur, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" },
    );
    setTimeout(() => p.remove(), dur + 50);
  }
}

/* ── Button visual style (matches the reference) ── */
const BTN_BG =
  "linear-gradient(180deg, #e01711 0%, #9a0606 9%, #6e0202 30%, #660202 58%, #950606 77%, #f6300f 90%, #ab1212 100%)";

const BTN_SHADOW_BASE =
  "0 0 8px 1px rgba(255,35,20,0.95), 0 0 20px 3px rgba(235,15,10,0.6), 0 0 38px 7px rgba(200,8,8,0.35), inset 0 3px 7px rgba(255,70,40,0.6), inset 0 -6px 10px rgba(255,60,25,0.7)";

const BTN_SHADOW_ACTIVE =
  "0 0 10px 2px rgba(255,55,35,1), 0 0 28px 6px rgba(240,18,12,0.75), 0 0 48px 10px rgba(205,10,10,0.45), inset 0 3px 8px rgba(255,90,55,0.7), inset 0 -6px 10px rgba(255,70,30,0.78)";

const ICON_GLOW =
  "drop-shadow(0 0 0.5px rgba(255,255,255,0.6)) drop-shadow(0 0 1.5px rgba(255,215,0,0.35)) drop-shadow(0 4px 3px rgba(0,0,0,0.55))";

export interface ShortcutGridProps {
  items: ShortcutItem[];
  variant: "desktop" | "mobile";
}

/**
 * ShortcutGrid — six red-neon shortcut buttons below the hero banner.
 * Buttons, icons and effects are hand-built in CSS + custom SVG (no PNGs, no
 * default Lucide). desktop and mobile share the design; only sizing differs.
 * A casino particle burst fires on click.
 */
export function ShortcutGrid({ items, variant }: ShortcutGridProps) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";
  const iconPx = isDesktop ? 33 : 25;

  const handleClick = useCallback((e: React.MouseEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.92)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "ease-out" },
    );
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, id);
  }, []);

  return (
    <nav aria-label="Shortcuts" className="bg-tcl-black">
      <ul className={cn("grid grid-cols-6", isDesktop ? "gap-3" : "gap-1.5")}>
        {items.map((item) => {
          const Icon = SHORTCUT_ICONS[item.id] ?? SHORTCUT_ICONS.home;
          const isChat = item.id === "live-chat";
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                onClick={(e) => handleClick(e, item.id)}
                className={cn(
                  "group relative flex select-none flex-col items-center justify-between overflow-hidden transition-[box-shadow] duration-200",
                  isDesktop ? "h-[76px] rounded-[10px] py-[11px]" : "h-[60px] rounded-[9px] py-[8px]",
                )}
                style={{
                  background: BTN_BG,
                  border: `2px solid ${active ? "#ff3b2a" : "#ff2418"}`,
                  boxShadow: active ? BTN_SHADOW_ACTIVE : BTN_SHADOW_BASE,
                }}
              >
                <Icon
                  className="shortcut-icon-float"
                  style={{
                    color: "#FFD700",
                    width: isChat ? iconPx * 1.17 : iconPx,
                    height: iconPx,
                    filter: ICON_GLOW,
                  }}
                />
                <span
                  className={cn(
                    "relative whitespace-nowrap font-display uppercase leading-none text-tcl-white",
                    isDesktop ? "text-[15px] tracking-wide" : "text-[10px] tracking-tight",
                  )}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6), 0 0 6px rgba(0,0,0,0.3)" }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
