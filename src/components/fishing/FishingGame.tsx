"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ICONS } from "@/lib/icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { cn } from "@/lib/cn";
import { BN } from "@/i18n/bn";

/**
 * TCL11 Fishing Game — virtual-points demo.
 *
 * Canvas-based 60fps game: a gold cannon fires red bullets at swimming fish.
 * Each fish species has a point value and hits-to-kill. No wagering, no real
 * money, no wallet integration — it's a playable sample for the games menu
 * and anchors a future wagering build.
 */

type FishKind = "small" | "medium" | "large" | "boss";

interface FishDef {
  kind: FishKind;
  width: number;
  height: number;
  speed: number;
  hp: number;
  points: number;
  color: string;
  tail: string;
}

const FISH: Record<FishKind, FishDef> = {
  small: { kind: "small", width: 36, height: 22, speed: 1.4, hp: 1, points: 10, color: "#ffe079", tail: "#ff9f1c" },
  medium: { kind: "medium", width: 52, height: 30, speed: 1.0, hp: 2, points: 25, color: "#ff6b6b", tail: "#c92a2a" },
  large: { kind: "large", width: 72, height: 42, speed: 0.75, hp: 4, points: 60, color: "#9b59b6", tail: "#6c3483" },
  boss: { kind: "boss", width: 110, height: 62, speed: 0.55, hp: 8, points: 180, color: "#f1c40f", tail: "#b7950b" },
};

interface FishInstance {
  id: number;
  def: FishDef;
  x: number;
  y: number;
  dir: 1 | -1;
  hp: number;
  phase: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const BULLET_SPEED = 9;
const BULLET_LIFE_FRAMES = 110;
const CANNON_RELOAD_FRAMES = 6;
const SPAWN_INTERVAL_FRAMES = 42;

export function FishingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game state is in a ref so the render loop can mutate it without React
  // re-rendering 60 times a second.
  const stateRef = useRef({
    running: false,
    paused: false,
    score: 0,
    bullets: [] as Bullet[],
    fish: [] as FishInstance[],
    particles: [] as Particle[],
    cannonAngle: -Math.PI / 2,
    cannonX: 0,
    cannonY: 0,
    nextId: 1,
    spawnTimer: 0,
    reloadTimer: 0,
    mouseX: 0,
    mouseY: 0,
    gameOverFrame: null as number | null,
    width: 800,
    height: 480,
    time: 0,
  });

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [bulletsLeft, setBulletsLeft] = useState(200);
  const [muted, setMuted] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const beep = useCallback(
    (freq: number, duration: number, type: OscillatorType = "square", volume = 0.05) => {
      if (muted) return;
      try {
        if (!audioCtxRef.current) {
          const Ctor =
            typeof window !== "undefined"
              ? (window.AudioContext ??
                  (window as unknown as { webkitAudioContext?: typeof AudioContext })
                    .webkitAudioContext)
              : undefined;
          if (!Ctor) return;
          audioCtxRef.current = new Ctor();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        /* audio denied */
      }
    },
    [muted],
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.min(640, Math.max(360, Math.round(w * 0.56)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stateRef.current.width = w;
    stateRef.current.height = h;
    stateRef.current.cannonX = w / 2;
    stateRef.current.cannonY = h - 50;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const spawnFish = useCallback(() => {
    const s = stateRef.current;
    const roll = Math.random();
    const kind: FishKind = roll < 0.55 ? "small" : roll < 0.82 ? "medium" : roll < 0.96 ? "large" : "boss";
    const def = FISH[kind];
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const x = dir === 1 ? -def.width - 10 : s.width + def.width + 10;
    const y = 60 + Math.random() * (s.height - 180);
    s.fish.push({
      id: s.nextId++,
      def,
      x,
      y,
      dir,
      hp: def.hp,
      phase: Math.random() * Math.PI * 2,
    });
  }, []);

  const fire = useCallback(() => {
    const s = stateRef.current;
    if (!s.running || s.paused || s.reloadTimer > 0 || s.gameOverFrame !== null) return;
    if (bulletsLeft <= 0) return;
    const vx = Math.cos(s.cannonAngle) * BULLET_SPEED;
    const vy = Math.sin(s.cannonAngle) * BULLET_SPEED;
    s.bullets.push({
      id: s.nextId++,
      x: s.cannonX + Math.cos(s.cannonAngle) * 30,
      y: s.cannonY + Math.sin(s.cannonAngle) * 30,
      vx,
      vy,
      life: BULLET_LIFE_FRAMES,
    });
    s.reloadTimer = CANNON_RELOAD_FRAMES;
    setBulletsLeft((b) => b - 1);
    beep(820, 0.07, "square", 0.04);
  }, [bulletsLeft, beep]);

  const updateAim = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = stateRef.current;
    s.mouseX = clientX - rect.left;
    s.mouseY = clientY - rect.top;
    const dx = s.mouseX - s.cannonX;
    const dy = s.mouseY - s.cannonY;
    const angle = Math.atan2(dy, dx);
    // Clamp so the cannon never aims below the water line.
    s.cannonAngle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
  }, []);

  const burst = useCallback((x: number, y: number, color: string, count = 10) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 22 + Math.random() * 18,
        color,
      });
    }
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    s.time += 1;

    // Background — layered underwater gradient + subtle wave lines.
    const grad = ctx.createLinearGradient(0, 0, 0, s.height);
    grad.addColorStop(0, "#0a1b3d");
    grad.addColorStop(0.5, "#0a2b4a");
    grad.addColorStop(1, "#061020");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s.width, s.height);

    // Light shafts
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 5; i++) {
      const x = ((s.time / 3 + i * 170) % (s.width + 200)) - 100;
      ctx.fillStyle = "rgba(241, 191, 61, 0.03)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 0);
      ctx.lineTo(x - 40, s.height);
      ctx.lineTo(x - 130, s.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Bubbles
    for (let i = 0; i < 20; i++) {
      const bx = (i * 73 + (s.time * 0.5 + i * 11)) % s.width;
      const by = (s.height - ((s.time * 0.8 + i * 40) % s.height));
      ctx.beginPath();
      ctx.arc(bx, by, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
    }

    if (s.running && !s.paused && s.gameOverFrame === null) {
      // Spawn fish periodically
      s.spawnTimer -= 1;
      if (s.spawnTimer <= 0) {
        spawnFish();
        s.spawnTimer = SPAWN_INTERVAL_FRAMES + Math.random() * 20;
      }

      if (s.reloadTimer > 0) s.reloadTimer -= 1;

      // Update fish
      for (const f of s.fish) {
        f.x += f.def.speed * f.dir;
        f.phase += 0.08;
        f.y += Math.sin(f.phase) * 0.4;
      }
      // Remove off-screen fish
      s.fish = s.fish.filter(
        (f) =>
          (f.dir === 1 && f.x < s.width + f.def.width + 20) ||
          (f.dir === -1 && f.x > -f.def.width - 20),
      );

      // Update bullets, detect hits
      for (const b of s.bullets) {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 1;
      }
      const survivingBullets: Bullet[] = [];
      for (const b of s.bullets) {
        let hit = false;
        for (const f of s.fish) {
          if (
            Math.abs(b.x - f.x) < f.def.width / 2 &&
            Math.abs(b.y - f.y) < f.def.height / 2
          ) {
            hit = true;
            f.hp -= 1;
            burst(b.x, b.y, "#ffe079", 6);
            beep(1200, 0.03, "triangle", 0.03);
            if (f.hp <= 0) {
              s.score += f.def.points;
              setScore(s.score);
              burst(f.x, f.y, f.def.color, 18);
              beep(540, 0.14, "sawtooth", 0.05);
            }
            break;
          }
        }
        if (!hit && b.life > 0 && b.x > -20 && b.x < s.width + 20 && b.y > -20 && b.y < s.height) {
          survivingBullets.push(b);
        }
      }
      s.bullets = survivingBullets;
      s.fish = s.fish.filter((f) => f.hp > 0);

      // Update particles
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 1;
      }
      s.particles = s.particles.filter((p) => p.life > 0);

      // Auto game-over when bullets exhausted and none in flight
      if (bulletsLeft === 0 && s.bullets.length === 0) {
        s.gameOverFrame = s.time;
        setGameOver(true);
      }
    }

    // Draw fish
    for (const f of s.fish) {
      drawFish(ctx, f);
    }

    // Draw bullets
    for (const b of s.bullets) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff2e2e";
      ctx.fillStyle = "#ff2e2e";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw particles
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 30);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw cannon base + aim indicator
    drawCannon(ctx, s.cannonX, s.cannonY, s.cannonAngle);

    // Aim line
    if (s.running && !s.paused) {
      const len = 80;
      const ex = s.cannonX + Math.cos(s.cannonAngle) * len;
      const ey = s.cannonY + Math.sin(s.cannonAngle) * len;
      ctx.strokeStyle = "rgba(241, 191, 61, 0.3)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(s.cannonX, s.cannonY);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    rafRef.current = window.requestAnimationFrame(loop);
  }, [bulletsLeft, spawnFish, burst, beep]);

  useEffect(() => {
    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        fire();
      } else if (e.code === "KeyP") {
        setPaused((p) => {
          const next = !p;
          stateRef.current.paused = next;
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire]);

  const start = () => {
    const s = stateRef.current;
    s.running = true;
    s.paused = false;
    s.score = 0;
    s.bullets = [];
    s.fish = [];
    s.particles = [];
    s.spawnTimer = 0;
    s.reloadTimer = 0;
    s.gameOverFrame = null;
    setScore(0);
    setBulletsLeft(200);
    setRunning(true);
    setPaused(false);
    setGameOver(false);
  };

  const togglePause = () => {
    if (!running) return;
    stateRef.current.paused = !stateRef.current.paused;
    setPaused(stateRef.current.paused);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-card border border-tcl-red/40 shadow-[0_0_30px_rgba(220,38,38,0.25)]">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none select-none"
          onMouseMove={(e) => updateAim(e.clientX, e.clientY)}
          onMouseDown={(e) => {
            updateAim(e.clientX, e.clientY);
            fire();
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) {
              updateAim(t.clientX, t.clientY);
              fire();
            }
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) updateAim(t.clientX, t.clientY);
          }}
        />

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3">
          <div className="rounded-md border border-tcl-gold/60 bg-black/60 px-3 py-1.5 text-tcl-gold font-display">
            <span className="text-[10px] uppercase tracking-wider">{BN.fishing.score}</span>
            <p className="text-heading-md leading-none">{score.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-tcl-red/60 bg-black/60 px-3 py-1.5 text-tcl-red-bright font-display">
            <span className="text-[10px] uppercase tracking-wider">{BN.fishing.bullets}</span>
            <p className="text-heading-md leading-none">{bulletsLeft}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className="pointer-events-auto absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full border border-tcl-gold/40 bg-black/60 text-tcl-gold hover:bg-black/80 cursor-pointer"
          aria-label={muted ? BN.fishing.unmuted : BN.fishing.muted}
          title={muted ? BN.fishing.unmuted : BN.fishing.muted}
        >
          {muted ? (
            <ICONS.Headphones aria-hidden="true" className="size-5" />
          ) : (
            <ICONS.Music2 aria-hidden="true" className="size-5" />
          )}
        </button>

        {/* Start overlay */}
        {!running && !gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center p-4">
            <ICONS.Target aria-hidden="true" className="mb-2 size-14 text-tcl-gold" />
            <h2 className="font-display text-heading-lg uppercase text-tcl-white">
              {BN.fishing.title}
            </h2>
            <p className="mt-1 max-w-sm text-caption text-tcl-muted">
              {BN.fishing.howTo}
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={start} size="lg" icon="Play">
                {BN.fishing.play}
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* Pause overlay */}
        {paused && running && !gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <ICONS.Timer aria-hidden="true" className="mb-2 size-14 text-tcl-gold" />
            <h2 className="font-display text-heading-lg uppercase text-tcl-white">
              {BN.fishing.pause}
            </h2>
            <div className="mt-4">
              <PrimaryButton onClick={togglePause} size="md" icon="Play">
                {BN.fishing.resume}
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {/* Game over overlay */}
        {gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-center p-4">
            <ICONS.Crown aria-hidden="true" className="mb-2 size-14 text-tcl-gold" />
            <h2 className="font-display text-heading-lg uppercase text-tcl-white">
              {BN.fishing.gameOver}
            </h2>
            <p className="mt-1 text-caption text-tcl-muted">{BN.fishing.finalScore}</p>
            <p className="font-display text-display-xl uppercase text-tcl-gold">
              {score.toLocaleString()}
            </p>
            <div className="mt-4">
              <PrimaryButton onClick={start} size="lg" icon="Play">
                {BN.fishing.newGame}
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </div>

      {/* External controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PrimaryButton
          onClick={running ? togglePause : start}
          size="md"
          icon={running ? (paused ? "Play" : "Timer") : "Play"}
          disabled={gameOver}
        >
          {!running ? BN.fishing.play : paused ? BN.fishing.resume : BN.fishing.pause}
        </PrimaryButton>
        <SecondaryButton
          onClick={start}
          variant="outline"
          size="md"
          icon="Zap"
        >
          {BN.fishing.restart}
        </SecondaryButton>
      </div>

      <p className={cn("text-center text-caption", "text-tcl-muted")}>
        {BN.fishing.virtualNote}
      </p>
    </div>
  );
}

function drawFish(ctx: CanvasRenderingContext2D, f: FishInstance) {
  const { x, y, dir, def } = f;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir === 1 ? 1 : -1, 1);
  ctx.shadowBlur = 12;
  ctx.shadowColor = def.color;

  // Body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, def.width / 2, def.height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.shadowBlur = 6;
  ctx.fillStyle = def.tail;
  ctx.beginPath();
  ctx.moveTo(-def.width / 2, 0);
  ctx.lineTo(-def.width / 2 - 14, -def.height / 2);
  ctx.lineTo(-def.width / 2 - 14, def.height / 2);
  ctx.closePath();
  ctx.fill();

  // Fins
  ctx.beginPath();
  ctx.moveTo(-def.width / 6, def.height / 2 - 2);
  ctx.lineTo(0, def.height / 2 + 8);
  ctx.lineTo(def.width / 6, def.height / 2 - 2);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(def.width / 3, -def.height / 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(def.width / 3 + 0.7, -def.height / 6, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCannon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
) {
  // Base ring
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#f1bf3d";
  ctx.fillStyle = "#1a0a0a";
  ctx.beginPath();
  ctx.arc(cx, cy + 10, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f1bf3d";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  // Barrel
  ctx.save();
  ctx.translate(cx, cy + 4);
  ctx.rotate(angle);
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#dc2626";
  const grad = ctx.createLinearGradient(0, -8, 0, 8);
  grad.addColorStop(0, "#f1bf3d");
  grad.addColorStop(0.4, "#dc2626");
  grad.addColorStop(1, "#7a1010");
  ctx.fillStyle = grad;
  ctx.fillRect(0, -7, 42, 14);
  ctx.strokeStyle = "#f1bf3d";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, -7, 42, 14);
  // Muzzle
  ctx.fillStyle = "#200";
  ctx.beginPath();
  ctx.arc(42, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center jewel
  ctx.fillStyle = "#f1bf3d";
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 5, 0, Math.PI * 2);
  ctx.fill();
}
