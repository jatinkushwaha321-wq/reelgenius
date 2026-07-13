'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import EnterNivoCTA from '@/components/landing/EnterNivoCTA';
import CreatorIntelligenceSection from '@/components/landing/CreatorIntelligenceSection';
import IntelligenceFieldsSection from '@/components/landing/IntelligenceFieldsSection';
import EnterNivoSection from '@/components/landing/EnterNivoSection';

/**
 * NIVO Landing — UI-1b Product Entry & Capability Language
 *
 * Composition:
 *   Layer 0: Solid dark background (#06060e via body)
 *   Layer 1: Full-viewport video (decorative, muted, looping)
 *   Layer 2: Dark gradient overlays (left fade, bottom vignette, radial center-right glow)
 *   Layer 3: Noise grain texture (inherited from noise-bg)
 *   Layer 4: Left glass panel + typography + CTA + pills (z-10)
 *   Layer 5: Observation cue near liquid form (z-10)
 */
export default function LandingPage() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const mainRef = useRef(null);
  const videoContainerRef = useRef(null);
  const glowRef = useRef(null);
  const obsSurfaceRef = useRef(null);
  const cardRef = useRef(null);
  const [cardHovered, setCardHovered] = useState(false);
  const [eyebrowDotHovered, setEyebrowDotHovered] = useState(false);
  const [obsDotHovered, setObsDotHovered] = useState(false);
  const [hoveredCapsule, setHoveredCapsule] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      if (!videoRef.current) return;
      if (mq.matches) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [videoReady]);

  // A — Hero Depth Parallax (Fine pointer & reduced motion gated)
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    let rafId;

    const handlePointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const nx = (clientX / innerWidth) - 0.5;
      const ny = (clientY / innerHeight) - 0.5;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (videoContainerRef.current) {
          // Translate video (orb) max 6px
          videoContainerRef.current.style.transform = `translate(${nx * 12}px, ${ny * 12}px)`;
        }
        if (glowRef.current) {
          // Translate separately controllable highlight max 3px
          glowRef.current.style.transform = `translate(${nx * 6}px, ${ny * 6}px)`;
        }
        if (obsSurfaceRef.current) {
          // Translate surface opposite direction max 2px
          obsSurfaceRef.current.style.transform = `translate(${-nx * 4}px, ${-ny * 4}px)`;
        }
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (videoContainerRef.current) videoContainerRef.current.style.transform = '';
        if (glowRef.current) glowRef.current.style.transform = '';
        if (obsSurfaceRef.current) obsSurfaceRef.current.style.transform = '';
      });
    };

    main.addEventListener('pointermove', handlePointerMove);
    main.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      main.removeEventListener('pointermove', handlePointerMove);
      main.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // C — Cursor-following surface light (Fine pointer gated)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let rafId;

    const handleCardPointerMove = (e) => {
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty('--surface-x', `${x}px`);
        card.style.setProperty('--surface-y', `${y}px`);
        card.style.setProperty('--surface-presence', '1');
      });
    };

    const handleCardPointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.style.setProperty('--surface-presence', '0');
      });
    };

    card.addEventListener('pointermove', handleCardPointerMove);
    card.addEventListener('pointerleave', handleCardPointerLeave);
    return () => {
      card.removeEventListener('pointermove', handleCardPointerMove);
      card.removeEventListener('pointerleave', handleCardPointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
    <main ref={mainRef} className="relative min-h-screen overflow-hidden noise-bg">
      {/* ============================================================
          LAYER 1 — Background Video
          Decorative, muted, looping. Covers the hero viewport.
          object-position biases the organic form toward center-right.
          ============================================================ */}
      <div ref={videoContainerRef} className="absolute inset-0 z-0 transition-transform duration-300 ease-out" aria-hidden="true">
        <video
          ref={videoRef}
          className="h-full w-full object-cover transition-opacity duration-1000"
          style={{
            objectPosition: '68% 50%',
            opacity: videoReady ? 0.45 : 0,
          }}
          src="/videos/nivo-intelligence-fluid-v2.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlayThrough={() => setVideoReady(true)}
        />
      </div>

      {/* ============================================================
          LAYER 2 — Dark gradient overlays
          These ensure the left panel area is deeply dark and readable,
          while letting the video form breathe through center-right.
          ============================================================ */}
      <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
        {/* Left-to-right fade: deeply dark on the left panel region */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(6,6,14,0.97) 0%, rgba(6,6,14,0.88) 32%, rgba(6,6,14,0.45) 52%, rgba(6,6,14,0.10) 70%, transparent 85%)',
          }}
        />
        {/* Bottom vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(0deg, rgba(6,6,14,0.90) 0%, transparent 40%)',
          }}
        />
        {/* Top subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(6,6,14,0.60) 0%, transparent 25%)',
          }}
        />
        {/* Restrained radial glow in center-right to accent the video form */}
        <div
          ref={glowRef}
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            background: 'radial-gradient(ellipse 50% 60% at 65% 45%, rgba(124,58,237,0.06) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* ============================================================
          LAYER 4 — Content: Left Glass Panel
          ============================================================ */}
      <div className="relative z-10 flex min-h-screen">
        {/* ---------- LEFT PANEL ---------- */}
        <div
          className="
            relative flex flex-col
            w-full
            md:w-[42%] md:max-w-[620px] md:min-w-[360px]
            min-h-screen
            px-6 py-6
            md:px-10 md:py-8
            lg:px-12 lg:py-10
          "
        >
          {/* Glass panel background — strong glass tier, rounded on desktop */}
          <div
            className="
              absolute inset-0
              md:inset-y-4 md:inset-x-0 md:left-4
              md:rounded-2xl
              nivo-glass-strong
              nivo-glass-no-top-edge
            "
            aria-hidden="true"
          />

          {/* Panel content (above the glass background) */}
          <div className="relative z-10 flex flex-col h-full">
            {/* ---- TOP BAR: Wordmark + Menu ---- */}
            <header className="flex items-center justify-between mb-auto">
              <span className="text-[15px] font-semibold tracking-tight text-white/90 shrink-0">
                NIVO <span className="text-white/30">/</span>
              </span>

              <button
                type="button"
                className="
                  nivo-glass-light
                  flex items-center gap-2
                  rounded-full
                  px-4 py-2
                  text-xs font-medium tracking-widest text-white/70 uppercase
                  transition-colors hover:text-white/90
                  shrink-0
                "
                aria-label="Menu"
              >
                <span>Menu</span>
                <Menu className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </header>

            {/* ---- HERO CONTENT ---- */}
            <div className="flex flex-col justify-center flex-1 py-12 md:py-16">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <div
                  onMouseEnter={() => setEyebrowDotHovered(true)}
                  onMouseLeave={() => setEyebrowDotHovered(false)}
                  className="inline-flex items-center justify-center cursor-default relative z-10 select-none"
                  style={{ width: '28px', height: '28px', marginLeft: '-11px', marginRight: '-11px' }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-violet-400/80 transition-all duration-200 ease-out"
                    style={{
                      transform: eyebrowDotHovered ? 'scale(1.4)' : 'scale(1)',
                      boxShadow: eyebrowDotHovered
                        ? '0 0 8px rgba(167, 139, 250, 0.65), 0 0 16px rgba(139, 92, 246, 0.18)'
                        : 'none',
                      backgroundColor: eyebrowDotHovered ? 'rgba(167, 139, 250, 1)' : undefined,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <span
                  className={`text-[11px] font-medium tracking-[0.2em] uppercase transition-colors duration-200 ${
                    eyebrowDotHovered ? 'text-white/65' : 'text-white/50'
                  }`}
                >
                  Creator Intelligence
                </span>
              </div>

              {/* Heading */}
              <h1 className="mb-6 md:mb-8">
                <span className="block text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-white">
                  Your Content,
                </span>
                <span
                  className="block text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[1.1] tracking-tight text-white/90"
                  style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
                >
                  Supercharged
                </span>
              </h1>

              {/* Supporting copy */}
              <p className="max-w-md text-[15px] leading-relaxed text-white/45 md:text-base mb-8 md:mb-10">
                NIVO reads your content, understands your audience,
                and turns hidden signals into clear creative direction.
              </p>

              {/* ---- PRIMARY CTA ---- */}
              <div className="mb-8 md:mb-10">
                <EnterNivoCTA />
              </div>

              {/* ---- CAPABILITY PILLS ---- */}
              <div className="flex flex-wrap gap-2.5" role="list" aria-label="NIVO capabilities">
                {[
                  { id: 'audience', label: 'Audience Signals' },
                  { id: 'content', label: 'Content Patterns' },
                  { id: 'direction', label: 'Creative Direction' },
                ].map((capsule) => {
                  const isHovered = hoveredCapsule === capsule.id;
                  return (
                    <span
                      key={capsule.id}
                      role="listitem"
                      onMouseEnter={() => setHoveredCapsule(capsule.id)}
                      onMouseLeave={() => setHoveredCapsule(null)}
                      className="
                        nivo-glass-light
                        rounded-full
                        px-4 py-1.5
                        text-[10px] font-medium tracking-[0.18em] uppercase
                        select-none cursor-default
                        transition-all duration-300 ease-out
                      "
                      style={{
                        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                        borderColor: isHovered ? 'rgba(255, 255, 255, 0.15)' : undefined,
                        backgroundColor: isHovered ? 'rgba(139, 92, 246, 0.035)' : undefined,
                        color: isHovered ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.60)',
                        boxShadow: isHovered ? '0 0 18px rgba(139, 92, 246, 0.06)' : undefined,
                      }}
                    >
                      {capsule.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Spacer at bottom to prevent content from sitting at the absolute bottom */}
            <div className="h-12 md:h-16" aria-hidden="true" />
          </div>
        </div>

        {/* ---------- RIGHT SIDE: Negative space + Intelligence Surface + Observation Cue ---------- */}
        <div className="hidden md:flex flex-1 relative">

          {/* ---- Intelligence Interpretation Surface ---- */}
          {/* Outer: positioning only. Inner: glass styling.
              Separated because .nivo-glass-strong sets position:relative,
              which would override the absolute positioning. */}
          <div
            ref={obsSurfaceRef}
            className="
              absolute
              bottom-[32%] right-[8%]
              lg:bottom-[34%] lg:right-[10%]
              w-[280px] lg:w-[300px]
              pointer-events-none
              transition-transform duration-300 ease-out
            "
          >
            <div
              ref={cardRef}
              onMouseEnter={() => setCardHovered(true)}
              onMouseLeave={() => setCardHovered(false)}
              className="
                nivo-glass-light
                rounded-2xl
                px-5 py-4
                pointer-events-auto
                relative overflow-hidden
                transition-colors duration-300
              "
              style={{
                '--surface-x': '0px',
                '--surface-y': '0px',
                '--surface-presence': '0',
                borderColor: cardHovered ? 'rgba(255,255,255,0.12)' : undefined,
              }}
            >
              {/* Radial pointer highlight */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[var(--surface-presence)]"
                style={{
                  background: 'radial-gradient(260px circle at var(--surface-x) var(--surface-y), rgba(139, 92, 246, 0.06), transparent 65%)',
                }}
                aria-hidden="true"
              />
              {/* Border response overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[var(--surface-presence)] rounded-2xl"
                style={{
                  padding: '1px',
                  background: 'radial-gradient(180px circle at var(--surface-x) var(--surface-y), rgba(139, 92, 246, 0.25), transparent 70%)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
                aria-hidden="true"
              />

              {/* Top label */}
              <span
                className={`text-[9px] font-medium tracking-[0.22em] uppercase block mb-4 transition-colors duration-300 ${
                  cardHovered ? 'text-white/55' : 'text-white/35'
                }`}
                aria-hidden="true"
              >
                Reading Your Content
              </span>

              {/* Interpretation copy */}
              <p className="text-[14px] leading-relaxed text-white/85 mb-5 relative z-10">
                Visual rhythm is strongest when motion enters before the subject is revealed.
              </p>

              {/* Signal label */}
              <div className="flex items-center gap-2 relative z-10">
                <span className="h-px w-4 bg-white/15" aria-hidden="true" />
                <span className="text-[8px] font-medium tracking-[0.2em] text-white/30 uppercase">
                  Signal / Visual Rhythm
                </span>
              </div>
            </div>
          </div>

          {/* ---- NIVO Observation Cue — positioned near the liquid form ---- */}
          <div
            className="
              absolute
              bottom-[18%] right-[12%]
              lg:bottom-[20%] lg:right-[14%]
              flex flex-col items-end gap-1.5
              select-none pointer-events-none
            "
            aria-hidden="true"
          >
            {/* Tiny indicator + label */}
            <div className="flex items-center gap-2">
              <div
                onMouseEnter={() => setObsDotHovered(true)}
                onMouseLeave={() => setObsDotHovered(false)}
                className="inline-flex items-center justify-center cursor-default relative z-10 pointer-events-auto select-none"
                style={{ width: '24px', height: '24px', marginLeft: '-10px', marginRight: '-10px' }}
              >
                <span
                  className="h-1 w-1 rounded-full bg-violet-400/50 transition-all duration-200 ease-out"
                  style={{
                    transform: obsDotHovered
                      ? 'scale(1.45)'
                      : cardHovered
                        ? 'scale(1.2)'
                        : 'scale(1)',
                    boxShadow: obsDotHovered
                      ? '0 0 8px rgba(167, 139, 250, 0.65), 0 0 16px rgba(139, 92, 246, 0.18)'
                      : cardHovered
                        ? '0 0 6px rgba(167, 139, 250, 0.8)'
                        : 'none',
                    backgroundColor: obsDotHovered ? 'rgba(167, 139, 250, 1)' : undefined,
                  }}
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-[0.25em] uppercase transition-colors duration-300 ${
                  obsDotHovered
                    ? 'text-white/60'
                    : cardHovered
                      ? 'text-white/55'
                      : 'text-white/40'
                }`}
              >
                NIVO Observation 01
              </span>
            </div>
            {/* Subtle rule */}
            <div
              className="w-16 h-px mr-3 transition-colors duration-300"
              style={{
                background: cardHovered
                  ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)'
                  : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              }}
            />
            {/* Status text */}
            <span
              className={`text-[8px] font-medium tracking-[0.2em] uppercase mr-1 transition-colors duration-300 ${
                cardHovered ? 'text-white/45' : 'text-white/30'
              }`}
            >
              Pattern Recognition Active
            </span>
          </div>
        </div>
      </div>
    </main>

      {/* ============================================================
          SECTION 02 — Creator Intelligence Narrative
          ============================================================ */}
      <CreatorIntelligenceSection />

      {/* ============================================================
          SECTION 03 — Intelligence Fields
          ============================================================ */}
      <IntelligenceFieldsSection />

      {/* ============================================================
          SECTION 04 — Enter NIVO (Final Landing Closure)
          ============================================================ */}
      <EnterNivoSection />
    </>
  );
}
