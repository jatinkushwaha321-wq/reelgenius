'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import EnterNivoCTA from '@/components/landing/EnterNivoCTA';

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

  // Respect prefers-reduced-motion: pause the video if motion is reduced
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

  return (
    <main className="relative min-h-screen overflow-hidden noise-bg">
      {/* ============================================================
          LAYER 1 — Background Video
          Decorative, muted, looping. Covers the hero viewport.
          object-position biases the organic form toward center-right.
          ============================================================ */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
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
          className="absolute inset-0"
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
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400/80" aria-hidden="true" />
                <span className="text-[11px] font-medium tracking-[0.2em] text-white/50 uppercase">
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
                <span
                  role="listitem"
                  className="
                    nivo-glass-light
                    rounded-full
                    px-4 py-1.5
                    text-[10px] font-medium tracking-[0.18em] text-white/60 uppercase
                    select-none
                  "
                >
                  Audience Signals
                </span>
                <span
                  role="listitem"
                  className="
                    nivo-glass-light
                    rounded-full
                    px-4 py-1.5
                    text-[10px] font-medium tracking-[0.18em] text-white/60 uppercase
                    select-none
                  "
                >
                  Content Patterns
                </span>
                <span
                  role="listitem"
                  className="
                    nivo-glass-light
                    rounded-full
                    px-4 py-1.5
                    text-[10px] font-medium tracking-[0.18em] text-white/60 uppercase
                    select-none
                  "
                >
                  Creative Direction
                </span>
              </div>
            </div>

            {/* Spacer at bottom to prevent content from sitting at the absolute bottom */}
            <div className="h-12 md:h-16" aria-hidden="true" />
          </div>
        </div>

        {/* ---------- RIGHT SIDE: Negative space + Observation Cue ---------- */}
        <div className="hidden md:flex flex-1 relative">
          {/* NIVO Observation Cue — positioned near the liquid form */}
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
              <span className="h-1 w-1 rounded-full bg-violet-400/50" />
              <span className="text-[9px] font-medium tracking-[0.25em] text-white/40 uppercase">
                NIVO Observation 01
              </span>
            </div>
            {/* Subtle rule */}
            <div
              className="w-16 h-px mr-3"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              }}
            />
            {/* Status text */}
            <span className="text-[8px] font-medium tracking-[0.2em] text-white/30 uppercase mr-1">
              Pattern Recognition Active
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
