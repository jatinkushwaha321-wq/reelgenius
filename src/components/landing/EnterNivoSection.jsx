'use client';

import { useState, useEffect, useRef } from 'react';
import EnterNivoCTA from '@/components/landing/EnterNivoCTA';

/**
 * Section 04 — Enter NIVO (Final Landing Closure)
 *
 * Closing narrative + session-aware CTA + minimal footer.
 * Reuses EnterNivoCTA for auth-aware routing.
 *
 * Enhanced with:
 *   - Proximity response on SIGNAL INTAKE READY status dot & separator rule.
 *   - Footer System Wake response on footer hover (separator highlight coordinate updates).
 *   - Fine-pointer & reduced motion compliance.
 */
export default function EnterNivoSection() {
  const [footerHovered, setFooterHovered] = useState(false);

  const sectionRef = useRef(null);
  const dotRef = useRef(null);
  const ruleRef = useRef(null);
  const footerRef = useRef(null);
  const separatorRef = useRef(null);

  // Proximity Node response (A category)
  useEffect(() => {
    const section = sectionRef.current;
    const dot = dotRef.current;
    const rule = ruleRef.current;
    if (!section || !dot || !rule) return;

    let rafId;

    const handlePointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const { clientX, clientY } = e;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = dot.getBoundingClientRect();
        const nodeX = rect.left + rect.width / 2;
        const nodeY = rect.top + rect.height / 2;

        const dx = clientX - nodeX;
        const dy = clientY - nodeY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Proximity radius of 120px for this status detail
        const radius = 120;
        const response = 1 - Math.min(distance / radius, 1);
        const eased = response * response * (3 - 2 * response); // Smoothstep

        dot.style.setProperty('--signal-response', eased);
        rule.style.setProperty('--signal-response', eased);
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        dot.style.setProperty('--signal-response', '0');
        rule.style.setProperty('--signal-response', '0');
      });
    };

    section.addEventListener('pointermove', handlePointerMove);
    section.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Footer separator linear cursor highlight (C category)
  useEffect(() => {
    const footer = footerRef.current;
    const separator = separatorRef.current;
    if (!footer || !separator) return;

    let rafId;

    const handleFooterPointerMove = (e) => {
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const rect = footer.getBoundingClientRect();
      const x = e.clientX - rect.left;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        separator.style.setProperty('--footer-x', `${x}px`);
        separator.style.setProperty('--footer-presence', '1');
      });
    };

    const handleFooterPointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        separator.style.setProperty('--footer-presence', '0');
      });
    };

    footer.addEventListener('pointermove', handleFooterPointerMove);
    footer.addEventListener('pointerleave', handleFooterPointerLeave);
    return () => {
      footer.removeEventListener('pointermove', handleFooterPointerMove);
      footer.removeEventListener('pointerleave', handleFooterPointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#06060e] noise-bg"
      aria-labelledby="section-enter-nivo"
    >
      {/* ---- Transition rule from Section 03 ---- */}
      <div className="px-6 md:px-10 lg:px-12" aria-hidden="true">
        <div className="h-px w-full bg-white/[0.06]" />
      </div>

      {/* ---- Section content ---- */}
      <div
        className="
          px-6 md:px-10 lg:px-12
          pt-16 md:pt-20 lg:pt-24
          pb-0
        "
      >
        {/* Section index */}
        <div className="flex items-center gap-3 mb-12 md:mb-16">
          <span className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase">
            04
          </span>
          <span className="h-px w-6 bg-white/10" aria-hidden="true" />
          <span
            className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase"
            id="section-enter-nivo"
          >
            Enter NIVO
          </span>
        </div>

        {/* ---- Closing composition: Narrative + System-ready state ---- */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-[1.4fr_1fr]
            gap-16 md:gap-12 lg:gap-20
            max-w-5xl
            mb-16 md:mb-20 lg:mb-24
          "
        >
          {/* ---- LEFT: Primary closing narrative + CTA ---- */}
          <div>
            <h2
              className="
                text-[clamp(2rem,4.5vw,3.5rem)]
                font-bold leading-[1.08] tracking-tight
                text-white
                mb-8 md:mb-10
              "
            >
              Your content is
              <br />
              <span
                style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                className="text-white/85"
              >
                already speaking.
              </span>
            </h2>

            <div className="max-w-md mb-10 md:mb-12 space-y-4">
              <p className="text-[15px] md:text-base leading-relaxed text-white/45">
                The patterns are already there.
              </p>
              <p className="text-[15px] md:text-base leading-relaxed text-white/45">
                NIVO helps you see what they are pointing toward.
              </p>
            </div>

            {/* CTA — reuses existing session-aware component */}
            <EnterNivoCTA />
          </div>

          {/* ---- RIGHT: System-ready state ---- */}
          <div className="flex flex-col justify-end md:items-end">
            <div className="md:text-right">
              {/* Status indicators */}
              <div className="flex items-center gap-2 mb-4 md:justify-end">
                <span
                  ref={dotRef}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400/50 transition-all duration-300 ease-out"
                  style={{
                    transform: 'scale(calc(1 + var(--signal-response, 0) * 0.3))',
                    boxShadow: '0 0 calc(var(--signal-response, 0) * 8px) rgba(167, 139, 250, 0.6)',
                  }}
                  aria-hidden="true"
                />
                <span className="text-[9px] font-medium tracking-[0.22em] text-white/35 uppercase">
                  Signal Intake Ready
                </span>
              </div>

              {/* Subtle rule */}
              <div
                ref={ruleRef}
                className="h-px w-16 bg-white/[0.06] mb-4 md:ml-auto transition-colors duration-300"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, calc(0.06 + var(--signal-response, 0) * 0.12))',
                }}
                aria-hidden="true"
              />

              <span className="text-[8px] font-medium tracking-[0.2em] text-white/25 uppercase block">
                Awaiting Creator Input
              </span>
            </div>
          </div>
        </div>

        {/* Footer System Wake territory */}
        <div
          ref={footerRef}
          onMouseEnter={() => setFooterHovered(true)}
          onMouseLeave={() => setFooterHovered(false)}
          className="w-full relative mt-16 md:mt-24 pointer-events-auto"
        >
          {/* ---- Minimal footer separator with cursor highlight ---- */}
          <div ref={separatorRef} className="relative w-full overflow-hidden" style={{ height: '1px' }}>
            <div className="absolute inset-0 bg-white/[0.04] transition-colors duration-300" style={{ backgroundColor: footerHovered ? 'rgba(255, 255, 255, 0.07)' : undefined }} />
            <div
              className="absolute inset-y-0 h-px transition-opacity duration-300 pointer-events-none"
              style={{
                width: '240px',
                left: 'calc(var(--footer-x, 0px) - 120px)',
                opacity: 'var(--footer-presence, 0)',
                background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, transparent 80%)',
              }}
              aria-hidden="true"
            />
          </div>

          <footer className="flex items-center justify-between max-w-5xl py-7 md:py-8">
            {/* NIVO wordmark */}
            <span
              className={`text-[13px] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${
                footerHovered ? 'text-white/45' : 'text-white/30'
              }`}
            >
              NIVO <span className={footerHovered ? 'text-white/20' : 'text-white/15'}>/</span>
            </span>

            {/* Intelligence signature */}
            <span
              className={`text-[9px] font-medium tracking-[0.22em] uppercase transition-colors duration-300 ${
                footerHovered ? 'text-white/35' : 'text-white/20'
              }`}
            >
              Creator Intelligence
            </span>
          </footer>
        </div>
      </div>
    </section>
  );
}
