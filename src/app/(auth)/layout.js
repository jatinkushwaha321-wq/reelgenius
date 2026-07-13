'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';
import Link from 'next/link';

/**
 * AuthLayout — Asymmetric two-territory NIVO authentication environment
 *
 * Left territory  (≈45–48%): Auth micro-label, heading, supporting copy, form surface
 * Right territory (≈52–55%): Intelligence field SVG composition
 *
 * Interactions:
 *   - Form surface pointer illumination (radial violet glow follows cursor)
 *   - Primary signal node proximity response (scale + glow on cursor proximity)
 *
 * Entry motion: CSS-only staggered fade/settle with reduced-motion support
 */
export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  /* ---- Refs ---- */
  const formSurfaceRef = useRef(null);
  const rightPanelRef = useRef(null);
  const svgContainerRef = useRef(null);
  const primaryNodeRef = useRef(null);
  const glowCircleRef = useRef(null);
  const tracePathRef = useRef(null);
  const statusRef = useRef(null);

  /* ----------------------------------------------------------------
     Form surface pointer illumination
     Radial violet glow follows cursor across the glass surface.
     Uses RAF + CSS custom properties to avoid React state churn.
     ---------------------------------------------------------------- */
  useEffect(() => {
    const el = formSurfaceRef.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let rafId;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--auth-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--auth-y', `${e.clientY - rect.top}px`);
        el.style.setProperty('--auth-presence', '1');
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--auth-presence', '0');
      });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* ----------------------------------------------------------------
     Primary signal node proximity response
     Scale + glow intensifies as cursor approaches the primary node.
     Does NOT create a permanent idle RAF loop — only fires on pointermove.
     ---------------------------------------------------------------- */
  useEffect(() => {
    const panel = rightPanelRef.current;
    const svgCont = svgContainerRef.current;
    const node = primaryNodeRef.current;
    const glow = glowCircleRef.current;
    const trace = tracePathRef.current;
    const status = statusRef.current;
    if (!panel || !svgCont) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId;
    const onMove = (e) => {
      // Primary node is at center of SVG container
      const rect = svgCont.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = 1 - Math.min(dist / 150, 1);
      const eased = proximity * proximity * (3 - 2 * proximity);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (node) {
          const s = 1 + eased * 0.25;
          node.style.transform = `scale(${s})`;
          node.style.filter = `drop-shadow(0 0 ${4 + eased * 8}px rgba(167, 139, 250, ${0.3 + eased * 0.35}))`;
        }
        if (glow) {
          glow.style.opacity = String(0.35 + eased * 0.35);
        }
        if (trace) {
          trace.style.opacity = String(0.25 + eased * 0.20);
        }
        if (status) {
          status.style.opacity = String(0.32 + eased * 0.13);
        }
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (node) {
          node.style.transform = 'scale(1)';
          node.style.filter = 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.3))';
        }
        if (glow) glow.style.opacity = '0.35';
        if (trace) trace.style.opacity = '0.25';
        if (status) status.style.opacity = '0.32';
      });
    };

    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerleave', onLeave);
    return () => {
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06060e] noise-bg overflow-hidden flex flex-col">
      {/* ---- Atmospheric violet gradients ---- */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div
          className="absolute top-[20%] left-[10%] h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.04), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[10%] right-[20%] h-[500px] w-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.03), transparent 70%)' }}
        />
      </div>

      {/* ---- Auth Header ---- */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 lg:px-12 pt-8 md:pt-10 nivo-auth-entry-1">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-white/90 hover:text-white transition-colors duration-200"
        >
          NIVO <span className="text-white/30">/</span>
        </Link>

        {/* Contextual navigation */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-medium tracking-[0.2em] text-white/30 uppercase hidden sm:inline">
            {isLogin ? 'New to NIVO?' : 'Already inside?'}
          </span>
          <Link
            href={isLogin ? '/register' : '/login'}
            className="text-[11px] font-medium tracking-[0.15em] text-white/55 uppercase hover:text-white/80 transition-colors duration-200"
          >
            {isLogin ? 'Create Access' : 'Sign In'}
          </Link>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row">
        {/* LEFT: Auth Territory */}
        <div className="md:w-[48%] lg:w-[45%] shrink-0 flex flex-col justify-center px-6 md:px-10 lg:px-16 xl:px-20 py-10 md:py-0">
          {/* Micro-label */}
          <div className="flex items-center gap-2 mb-6 nivo-auth-entry-1">
            <span className="h-1 w-1 rounded-full bg-violet-400/60" aria-hidden="true" />
            <span className="text-[10px] font-medium tracking-[0.2em] text-white/35 uppercase">
              {isLogin ? 'Access / NIVO' : 'Entry / NIVO'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-4 nivo-auth-entry-2">
            {isLogin ? (
              <>
                <span className="block text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-white">
                  Return to the
                </span>
                <span
                  className="block text-[clamp(1.875rem,3.8vw,2.75rem)] leading-[1.15] tracking-tight text-white/90"
                  style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                >
                  signal.
                </span>
              </>
            ) : (
              <>
                <span className="block text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.1] tracking-tight text-white">
                  Begin with what
                </span>
                <span
                  className="block text-[clamp(1.875rem,3.8vw,2.75rem)] leading-[1.15] tracking-tight text-white/90"
                  style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                >
                  you create.
                </span>
              </>
            )}
          </h1>

          {/* Supporting copy */}
          <p className="text-[14px] md:text-[15px] leading-relaxed text-white/40 mb-8 md:mb-10 max-w-sm nivo-auth-entry-3">
            {isLogin
              ? 'Your intelligence environment is waiting.'
              : 'NIVO starts by learning how your content speaks.'}
          </p>

          {/* Form surface with pointer illumination */}
          <div
            ref={formSurfaceRef}
            className={`nivo-glass-auth rounded-2xl ${isLogin ? 'p-6 md:p-8' : 'p-5 md:py-6 md:px-7'} max-w-md nivo-auth-entry-4`}
            style={{
              '--auth-x': '0px',
              '--auth-y': '0px',
              '--auth-presence': '0',
            }}
          >
            {/* Pointer illumination overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
              style={{
                opacity: 'var(--auth-presence)',
                background: 'radial-gradient(260px circle at var(--auth-x) var(--auth-y), rgba(139, 92, 246, 0.05), transparent 65%)',
              }}
              aria-hidden="true"
            />

            {/* Form content */}
            <div className="relative z-[1]">
              {children}
            </div>
          </div>
        </div>

        {/* RIGHT: Intelligence Field */}
        <div
          ref={rightPanelRef}
          className="hidden md:flex flex-1 items-center justify-center relative cursor-default nivo-auth-entry-5"
        >
          <div
            ref={svgContainerRef}
            className="relative w-full max-w-[380px] lg:max-w-[420px] aspect-square"
          >
            {/* SVG composition */}
            <svg
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              aria-hidden="true"
            >
              {/* Dissolving horizontal trace */}
              <line
                x1="80" y1="200" x2="320" y2="200"
                stroke="url(#authTraceGrad)"
                strokeWidth="0.5"
                opacity="0.38"
              />

              {/* Incomplete curved trace — begins but dissolves */}
              <path
                ref={tracePathRef}
                d="M200 200 Q245 155 285 175"
                stroke="rgba(167, 139, 250, 0.25)"
                strokeWidth="0.5"
                fill="none"
                strokeDasharray="4 6"
                style={{ opacity: 0.25, transition: 'opacity 0.3s ease-out' }}
              />

              {/* Passive observation marks — intentionally disconnected */}
              <circle cx="120" cy="200" r="2" fill="white" fillOpacity="0.16" />
              <circle cx="285" cy="175" r="1.5" fill="white" fillOpacity="0.12" />
              <circle cx="235" cy="265" r="1.5" fill="white" fillOpacity="0.10" />

              {/* Atmospheric glow behind primary node */}
              <circle
                ref={glowCircleRef}
                cx="200" cy="200" r="60"
                fill="url(#authNodeGlow)"
                style={{ opacity: 0.35, transition: 'opacity 0.3s ease-out' }}
              />

              {/* Primary violet signal node */}
              <circle
                ref={primaryNodeRef}
                cx="200" cy="200" r="4"
                fill="rgba(167, 139, 250, 0.7)"
                style={{
                  transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
                  transformOrigin: '200px 200px',
                  filter: 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.3))',
                }}
              />

              {/* Faint temporal coordinates */}
              <text
                x="148" y="158"
                fill="white" fillOpacity="0.08"
                fontSize="7"
                fontFamily="var(--font-jetbrains-mono), monospace"
                letterSpacing="0.1em"
              >
                0.00
              </text>
              <text
                x="252" y="248"
                fill="white" fillOpacity="0.06"
                fontSize="7"
                fontFamily="var(--font-jetbrains-mono), monospace"
                letterSpacing="0.1em"
              >
                —
              </text>

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="authTraceGrad" x1="80" y1="200" x2="320" y2="200" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0" />
                  <stop offset="30%" stopColor="white" stopOpacity="0.08" />
                  <stop offset="70%" stopColor="white" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="authNodeGlow" cx="200" cy="200" r="60" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {/* Status labels */}
            <div className="absolute top-[12%] right-[8%] text-right select-none pointer-events-none">
              <span
                className="text-[8px] font-medium tracking-[0.25em] text-white/28 uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                System / Listening
              </span>
            </div>

            <div
              ref={statusRef}
              className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-center select-none pointer-events-none"
              style={{ opacity: 0.32, transition: 'opacity 0.3s ease-out' }}
            >
              <span className="text-[10px] font-medium tracking-[0.2em] text-white uppercase block mb-1.5">
                Awaiting Creator Signal
              </span>
              <span className="text-[8px] font-medium tracking-[0.15em] text-white/60 uppercase block">
                No Pattern Formed Yet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Mobile intelligence status ---- */}
      <div className="md:hidden px-6 pb-10 nivo-auth-entry-5">
        <div className="flex items-center justify-center gap-3 py-6 border-t border-white/[0.06]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400/50" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.2em] text-white/25 uppercase">
            Awaiting Creator Signal
          </span>
        </div>
      </div>
    </div>
  );
}
