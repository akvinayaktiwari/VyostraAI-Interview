import { VyostraLogo } from "./VyostraLogo";

// Ported from RigaChat/frontend/src/components/auth/AuthHeroPanel.tsx (VyostraAI brand panel).
const PANEL_BACKGROUND = `
  radial-gradient(58% 55% at 12% 10%, rgba(168,85,247,.55), transparent 60%),
  radial-gradient(52% 60% at 88% 92%, rgba(99,102,241,.5), transparent 62%),
  radial-gradient(45% 45% at 70% 25%, rgba(124,58,237,.35), transparent 60%),
  linear-gradient(155deg,#2a1a4f 0%,#1b1030 55%,#140b24 100%)
`;

export interface AuthHeroPanelProps {
  tagline: string;
  features: string[];
  footnote?: string;
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function GlowLayer() {
  return (
    <div
      aria-hidden="true"
      className="absolute -inset-[20%] z-[-1] auth-hero-drift"
      style={{ background: "radial-gradient(45% 45% at 50% 50%, rgba(168,85,247,.5), transparent 70%)" }}
    />
  );
}

function ProductName({ compact }: { compact: boolean }) {
  return (
    <>
      <span className={`font-display font-extrabold text-white ${compact ? "text-xl" : "text-4xl"}`}>Vyostra AI</span>
      <span
        className={`font-semibold uppercase text-white/80 ${compact ? "mt-1 text-[10px] tracking-[0.25em]" : "mt-2 text-xs tracking-[0.35em]"}`}
      >
        Interview
      </span>
    </>
  );
}

export function AuthHeroPanel({ tagline, features, footnote }: AuthHeroPanelProps) {
  return (
    <>
      {/* Desktop hero panel — left column of the split */}
      <div
        className="hidden lg:flex relative flex-col items-center justify-center isolate overflow-hidden w-full h-full min-h-screen p-11 text-white text-center"
        style={{ background: PANEL_BACKGROUND }}
      >
        <GlowLayer />
        <div className="mb-6">
          <VyostraLogo size={56} variant="white" />
        </div>
        <ProductName compact={false} />
        <p className="text-white/70 text-lg mt-4 mb-10 max-w-sm">{tagline}</p>
        <div className="flex flex-col items-center">
          {features.map((feature) => (
            <div
              key={feature}
              className="bg-white/10 border border-white/20 text-white text-sm px-5 py-2.5 rounded-full mb-3 flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4 text-white" />
              {feature}
            </div>
          ))}
        </div>
        {footnote && <p className="mt-12 text-white/40 text-xs">{footnote}</p>}
      </div>

      {/* Mobile compact header band — sits above the form */}
      <div
        className="flex lg:hidden relative flex-col items-center justify-center isolate overflow-hidden p-6 text-white text-center"
        style={{ background: PANEL_BACKGROUND }}
      >
        <GlowLayer />
        <div className="mb-3">
          <VyostraLogo size={32} variant="white" />
        </div>
        <ProductName compact />
        <p className="text-white/70 text-sm mt-2">{tagline}</p>
      </div>

      <style>{`
        @keyframes auth-hero-drift {
          0%, 100% { transform: translate(0, 0); }
          50%      { transform: translate(5%, -5%); }
        }
        .auth-hero-drift { animation: auth-hero-drift 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .auth-hero-drift { animation: none !important; }
        }
      `}</style>
    </>
  );
}

export default AuthHeroPanel;
