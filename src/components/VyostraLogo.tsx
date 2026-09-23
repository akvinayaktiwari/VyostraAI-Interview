"use client";

import { useEffect, useId, useRef } from "react";

// Ported from RigaChat/frontend/src/components/VyostraLogo.tsx (VyostraAI brand mark).
const X = [10.5, 21.25, 32, 42.75, 53.5] as const;
const VY1 = [9.5, 17.5, 27.5, 17.5, 9.5] as const;
const VY2 = [22.5, 36.5, 52.5, 36.5, 22.5] as const;
const RIPPLE_DURATION_MS = 900;
const RIPPLE_INTERVAL_MS = 4200;

export interface VyostraLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
  variant?: "gradient" | "white";
}

function useBarRipple(animate: boolean) {
  const lineRefs = useRef<(SVGLineElement | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    if (!animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bars = lineRefs.current;
    let raf = 0;
    let stopped = false;

    const set = (i: number, y1: number, y2: number): void => {
      bars[i]?.setAttribute("y1", String(y1));
      bars[i]?.setAttribute("y2", String(y2));
    };

    const rippleOnce = (): void => {
      const t0 = performance.now();
      const frame = (now: number): void => {
        if (stopped) return;
        const p = (now - t0) / RIPPLE_DURATION_MS;
        for (let i = 0; i < 5; i++) {
          const local = Math.min(1, Math.max(0, p * 1.7 - i * 0.14));
          const bump = p >= 1 ? 0 : Math.sin(local * Math.PI) * 3.2;
          set(i, VY1[i] - bump, VY2[i] + bump);
        }
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    const timeoutId = window.setTimeout(rippleOnce, RIPPLE_DURATION_MS);
    const intervalId = window.setInterval(rippleOnce, RIPPLE_INTERVAL_MS);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [animate]);

  return lineRefs;
}

export function VyostraLogo({ size = 36, animate = true, className, variant = "gradient" }: VyostraLogoProps) {
  const lineRefs = useBarRipple(animate);
  const gradientId = `vyostraLogoGrad-${useId().replace(/:/g, "")}`;
  const glow = variant === "white" ? "vyostra-logo-glow-white" : "vyostra-logo-glow";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label="Vyostra AI"
      data-variant={variant}
      className={className}
      style={animate ? { animation: `${glow} 3.2s ease-in-out infinite` } : undefined}
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {X.map((x, i) => (
        <line
          key={x}
          ref={(el: SVGLineElement | null) => {
            lineRefs.current[i] = el;
          }}
          x1={x}
          x2={x}
          y1={VY1[i]}
          y2={VY2[i]}
          stroke={variant === "white" ? "#ffffff" : `url(#${gradientId})`}
          strokeWidth={7}
          strokeLinecap="round"
        />
      ))}
      <style>{`
        @keyframes vyostra-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(124,58,237,.28)); }
          50%      { filter: drop-shadow(0 0 18px rgba(168,85,247,.55)); }
        }
        @keyframes vyostra-logo-glow-white {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255,255,255,.22)); }
          50%      { filter: drop-shadow(0 0 15px rgba(255,255,255,.5)); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg[aria-label="Vyostra AI"] { animation: none !important; }
        }
      `}</style>
    </svg>
  );
}

export interface VyostraWordmarkProps {
  size?: number;
  animate?: boolean;
  tone?: "dark" | "light";
  className?: string;
}

/** Logo mark + "Vyostra AI" wordmark + "Interview" product label. */
export function VyostraWordmark({ size = 30, animate = true, tone = "dark", className = "" }: VyostraWordmarkProps) {
  const light = tone === "light";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <VyostraLogo size={size} animate={animate} variant={light ? "white" : "gradient"} />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold text-lg tracking-tight ${light ? "text-white" : "text-gray-900"}`}>
          Vyostra AI
        </span>
        <span
          className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/70" : "text-violet-600"}`}
        >
          Interview
        </span>
      </div>
    </div>
  );
}

export default VyostraLogo;
