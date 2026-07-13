'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Section 03 — Intelligence Fields
 *
 * Introduces NIVO's three dimensions of creator understanding:
 *   Audience · Content · Direction
 *
 * Enhanced with:
 *   - Column hover state (pointerenter/pointerleave) to adjust typography focus
 *   - Cursor-following local background atmosphere coordinates inside active column
 *   - Proximity response on status indicator dots
 *   - Direct target response on status dots (hover scales to 1.45x and intensifies glow)
 *   - Comfortable 28px hit boxes for dots
 *   - Fine-pointer & reduced motion compliance
 */
export default function IntelligenceFieldsSection() {
  const [hoveredField, setHoveredField] = useState(null);
  const [hoveredDot, setHoveredDot] = useState(null);

  const sectionRef = useRef(null);
  const field1Ref = useRef(null);
  const field2Ref = useRef(null);
  const field3Ref = useRef(null);

  const dot1Ref = useRef(null);
  const dot2Ref = useRef(null);
  const dot3Ref = useRef(null);

  // Proximity Dot response (A category)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId;

    const handlePointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const { clientX, clientY } = e;

      const dots = [
        { ref: dot1Ref, radius: 100 },
        { ref: dot2Ref, radius: 100 },
        { ref: dot3Ref, radius: 100 },
      ];

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        dots.forEach(({ ref, radius }) => {
          const el = ref.current;
          if (!el) return;

          const rect = el.getBoundingClientRect();
          const nodeX = rect.left + rect.width / 2;
          const nodeY = rect.top + rect.height / 2;

          const dx = clientX - nodeX;
          const dy = clientY - nodeY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const response = 1 - Math.min(distance / radius, 1);
          const eased = response * response * (3 - 2 * response); // Smoothstep easing
          el.style.setProperty('--signal-response', eased);
        });
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        [dot1Ref, dot2Ref, dot3Ref].forEach((ref) => {
          if (ref.current) {
            ref.current.style.setProperty('--signal-response', '0');
          }
        });
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

  // Pointer local coordinates for atmospheric gradient inside hovered columns (C category)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let rafId;

    const createMoveHandler = (ref) => (e) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--field-x', `${x}px`);
        el.style.setProperty('--field-y', `${y}px`);
        el.style.setProperty('--field-presence', '1');
      });
    };

    const createLeaveHandler = (ref) => () => {
      const el = ref.current;
      if (!el) return;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--field-presence', '0');
      });
    };

    const el1 = field1Ref.current;
    const el2 = field2Ref.current;
    const el3 = field3Ref.current;

    const h1Move = createMoveHandler(field1Ref);
    const h1Leave = createLeaveHandler(field1Ref);
    const h2Move = createMoveHandler(field2Ref);
    const h2Leave = createLeaveHandler(field2Ref);
    const h3Move = createMoveHandler(field3Ref);
    const h3Leave = createLeaveHandler(field3Ref);

    if (el1) {
      el1.addEventListener('pointermove', h1Move);
      el1.addEventListener('pointerleave', h1Leave);
    }
    if (el2) {
      el2.addEventListener('pointermove', h2Move);
      el2.addEventListener('pointerleave', h2Leave);
    }
    if (el3) {
      el3.addEventListener('pointermove', h3Move);
      el3.addEventListener('pointerleave', h3Leave);
    }

    return () => {
      if (el1) {
        el1.removeEventListener('pointermove', h1Move);
        el1.removeEventListener('pointerleave', h1Leave);
      }
      if (el2) {
        el2.removeEventListener('pointermove', h2Move);
        el2.removeEventListener('pointerleave', h2Leave);
      }
      if (el3) {
        el3.removeEventListener('pointermove', h3Move);
        el3.removeEventListener('pointerleave', h3Leave);
      }
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Scale priority calculations
  const dotScale1 = hoveredDot === 'audience' ? 1.45 : (hoveredField === 'audience' ? 1.25 : 1);
  const labelOpacity1 = hoveredDot === 'audience' ? 'text-white/55' : (hoveredField === 'audience' ? 'text-white/40' : 'text-white/25');

  const dotScale2 = hoveredDot === 'content' ? 1.45 : (hoveredField === 'content' ? 1.25 : 1);
  const labelOpacity2 = hoveredDot === 'content' ? 'text-white/60' : (hoveredField === 'content' ? 'text-white/50' : 'text-white/35');

  const dotScale3 = hoveredDot === 'direction' ? 1.45 : (hoveredField === 'direction' ? 1.25 : 1);
  const labelOpacity3 = hoveredDot === 'direction' ? 'text-white/55' : (hoveredField === 'direction' ? 'text-white/40' : 'text-white/25');

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#06060e] noise-bg"
      aria-labelledby="section-intelligence-fields"
    >
      {/* ---- Transition rule from Section 02 ---- */}
      <div className="px-6 md:px-10 lg:px-12" aria-hidden="true">
        <div className="h-px w-full bg-white/[0.06]" />
      </div>

      {/* ---- Section content ---- */}
      <div
        className="
          min-h-screen
          px-6 md:px-10 lg:px-12
          pt-16 md:pt-20 lg:pt-24
          pb-24 md:pb-32 lg:pb-40
        "
      >
        {/* Section index */}
        <div className="flex items-center gap-3 mb-12 md:mb-16">
          <span className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase">
            03
          </span>
          <span className="h-px w-6 bg-white/10" aria-hidden="true" />
          <span
            className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase"
            id="section-intelligence-fields"
          >
            Intelligence Fields
          </span>
        </div>

        {/* ---- Primary heading + supporting copy ---- */}
        <div className="max-w-4xl mb-20 md:mb-24">
          <h2
            className="
              text-[clamp(2rem,4.5vw,3.5rem)]
              font-bold leading-[1.08] tracking-tight
              text-white
              mb-8 md:mb-10
            "
          >
            Understand more
            <br />
            <span
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              className="text-white/85"
            >
              than performance.
            </span>
          </h2>

          <div className="max-w-lg space-y-4">
            <p className="text-[15px] md:text-base leading-relaxed text-white/45">
              Metrics tell you what happened.
            </p>
            <p className="text-[15px] md:text-base leading-relaxed text-white/45">
              NIVO helps you understand why it happened — and what to explore next.
            </p>
          </div>
        </div>

        {/* ---- Intelligence Fields Composition ---- */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-[1fr_1.3fr_1fr]
            gap-12 md:gap-0
            max-w-5xl
          "
        >
          {/* ---- FIELD 01: AUDIENCE ---- */}
          <div
            ref={field1Ref}
            onMouseEnter={() => setHoveredField('audience')}
            onMouseLeave={() => setHoveredField(null)}
            className={`md:pr-8 lg:pr-12 relative overflow-hidden transition-all duration-300 ${
              hoveredField && hoveredField !== 'audience' ? 'opacity-[0.92]' : 'opacity-100'
            }`}
            style={{
              '--field-x': '0px',
              '--field-y': '0px',
              '--field-presence': '0',
            }}
          >
            {/* Field local pointer atmosphere */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[var(--field-presence)]"
              style={{
                background: 'radial-gradient(240px circle at var(--field-x) var(--field-y), rgba(139, 92, 246, 0.04), transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Field index */}
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span
                className={`text-[8px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                  hoveredField === 'audience' ? 'text-white/35' : 'text-white/20'
                }`}
              >
                Field 01
              </span>
            </div>

            {/* Field title */}
            <h3
              className={`text-lg md:text-xl font-semibold tracking-tight mb-5 relative z-10 transition-colors duration-300 ${
                hoveredField === 'audience' ? 'text-white' : 'text-white/75'
              }`}
            >
              Audience
            </h3>

            {/* Field description */}
            <div className="space-y-1.5 mb-6 relative z-10">
              {['What holds attention.', 'What creates curiosity.', 'What brings people back.'].map((text) => (
                <p
                  key={text}
                  className={`text-[13px] leading-relaxed transition-colors duration-300 ${
                    hoveredField === 'audience' ? 'text-white/55' : 'text-white/40'
                  }`}
                >
                  {text}
                </p>
              ))}
            </div>

            {/* Signal label */}
            <div className="flex items-center gap-2 relative z-10">
              <div
                onMouseEnter={() => setHoveredDot('audience')}
                onMouseLeave={() => setHoveredDot(null)}
                className="inline-flex items-center justify-center cursor-default relative z-20 pointer-events-auto"
                style={{ width: '28px', height: '28px', marginLeft: '-12px', marginRight: '-12px' }}
              >
                <span
                  ref={dot1Ref}
                  className="h-1 w-1 rounded-full bg-white/15 transition-all duration-200 ease-out"
                  style={{
                    transform: `scale(calc(${dotScale1} + var(--signal-response, 0) * 0.25))`,
                    backgroundColor: hoveredDot === 'audience'
                      ? 'rgba(167, 139, 250, 1)'
                      : hoveredField === 'audience'
                        ? 'rgba(167, 139, 250, 0.7)'
                        : undefined,
                    boxShadow: hoveredDot === 'audience'
                      ? '0 0 8px rgba(167, 139, 250, 0.75), 0 0 16px rgba(139, 92, 246, 0.25)'
                      : hoveredField === 'audience'
                        ? '0 0 6px rgba(167, 139, 250, 0.6)'
                        : 'none',
                  }}
                  aria-hidden="true"
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-[0.2em] transition-colors duration-200 uppercase ${labelOpacity1}`}
              >
                Attention Behavior
              </span>
            </div>
          </div>

          {/* ---- FIELD 02: CONTENT (center of gravity) ---- */}
          <div
            ref={field2Ref}
            onMouseEnter={() => setHoveredField('content')}
            onMouseLeave={() => setHoveredField(null)}
            className={`
              md:border-x md:border-white/[0.05]
              md:px-8 lg:px-12
              relative overflow-hidden transition-all duration-300
              ${hoveredField && hoveredField !== 'content' ? 'opacity-[0.92]' : 'opacity-100'}
            `}
            style={{
              '--field-x': '0px',
              '--field-y': '0px',
              '--field-presence': '0',
            }}
          >
            {/* Field local pointer atmosphere */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[var(--field-presence)]"
              style={{
                background: 'radial-gradient(240px circle at var(--field-x) var(--field-y), rgba(139, 92, 246, 0.04), transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Field index */}
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span
                className={`text-[8px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                  hoveredField === 'content' ? 'text-white/45' : 'text-white/30'
                }`}
              >
                Field 02
              </span>
            </div>

            {/* Field title — slightly stronger presence */}
            <h3
              className={`text-xl md:text-2xl font-bold tracking-tight mb-5 relative z-10 transition-colors duration-300 ${
                hoveredField === 'content' ? 'text-white' : 'text-white/90'
              }`}
            >
              Content
            </h3>

            {/* Field description — slightly stronger opacity */}
            <div className="space-y-1.5 mb-6 relative z-10">
              {['What patterns repeat.', 'What structures connect.', 'What your strongest work shares.'].map((text) => (
                <p
                  key={text}
                  className={`text-[14px] leading-relaxed transition-colors duration-300 ${
                    hoveredField === 'content' ? 'text-white/65' : 'text-white/50'
                  }`}
                >
                  {text}
                </p>
              ))}
            </div>

            {/* Signal label */}
            <div className="flex items-center gap-2 relative z-10">
              <div
                onMouseEnter={() => setHoveredDot('content')}
                onMouseLeave={() => setHoveredDot(null)}
                className="inline-flex items-center justify-center cursor-default relative z-20 pointer-events-auto"
                style={{ width: '28px', height: '28px', marginLeft: '-11px', marginRight: '-11px' }}
              >
                <span
                  ref={dot2Ref}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400/50 transition-all duration-200 ease-out"
                  style={{
                    transform: `scale(calc(${dotScale2} + var(--signal-response, 0) * 0.25))`,
                    backgroundColor: hoveredDot === 'content'
                      ? 'rgba(167, 139, 250, 1)'
                      : undefined,
                    boxShadow: hoveredDot === 'content'
                      ? '0 0 8px rgba(167, 139, 250, 0.75), 0 0 16px rgba(139, 92, 246, 0.25)'
                      : hoveredField === 'content'
                        ? '0 0 6px rgba(167, 139, 250, 0.7)'
                        : 'none',
                  }}
                  aria-hidden="true"
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-[0.2em] transition-colors duration-200 uppercase ${labelOpacity2}`}
              >
                Content Patterns
              </span>
            </div>

            {/* Subtle intelligence rule */}
            <div
              className="mt-6 h-px w-16 bg-white/[0.06] transition-colors duration-300 relative z-10"
              style={{
                backgroundColor: hoveredField === 'content' ? 'rgba(255,255,255,0.12)' : undefined,
              }}
              aria-hidden="true"
            />
          </div>

          {/* ---- FIELD 03: DIRECTION ---- */}
          <div
            ref={field3Ref}
            onMouseEnter={() => setHoveredField('direction')}
            onMouseLeave={() => setHoveredField(null)}
            className={`md:pl-8 lg:pl-12 relative overflow-hidden transition-all duration-300 ${
              hoveredField && hoveredField !== 'direction' ? 'opacity-[0.92]' : 'opacity-100'
            }`}
            style={{
              '--field-x': '0px',
              '--field-y': '0px',
              '--field-presence': '0',
            }}
          >
            {/* Field local pointer atmosphere */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-[var(--field-presence)]"
              style={{
                background: 'radial-gradient(240px circle at var(--field-x) var(--field-y), rgba(139, 92, 246, 0.04), transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Field index */}
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <span
                className={`text-[8px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                  hoveredField === 'direction' ? 'text-white/35' : 'text-white/20'
                }`}
              >
                Field 03
              </span>
            </div>

            {/* Field title */}
            <h3
              className={`text-lg md:text-xl font-semibold tracking-tight mb-5 relative z-10 transition-colors duration-300 ${
                hoveredField === 'direction' ? 'text-white' : 'text-white/75'
              }`}
            >
              Direction
            </h3>

            {/* Field description */}
            <div className="space-y-1.5 mb-6 relative z-10">
              {['What to test next.', 'What to emphasize.', 'Where the signal is pointing.'].map((text) => (
                <p
                  key={text}
                  className={`text-[13px] leading-relaxed transition-colors duration-300 ${
                    hoveredField === 'direction' ? 'text-white/55' : 'text-white/40'
                  }`}
                >
                  {text}
                </p>
              ))}
            </div>

            {/* Signal label */}
            <div className="flex items-center gap-2 relative z-10">
              <div
                onMouseEnter={() => setHoveredDot('direction')}
                onMouseLeave={() => setHoveredDot(null)}
                className="inline-flex items-center justify-center cursor-default relative z-20 pointer-events-auto"
                style={{ width: '28px', height: '28px', marginLeft: '-12px', marginRight: '-12px' }}
              >
                <span
                  ref={dot3Ref}
                  className="h-1 w-1 rounded-full bg-white/15 transition-all duration-200 ease-out"
                  style={{
                    transform: `scale(calc(${dotScale3} + var(--signal-response, 0) * 0.25))`,
                    backgroundColor: hoveredDot === 'direction'
                      ? 'rgba(167, 139, 250, 1)'
                      : hoveredField === 'direction'
                        ? 'rgba(167, 139, 250, 0.7)'
                        : undefined,
                    boxShadow: hoveredDot === 'direction'
                      ? '0 0 8px rgba(167, 139, 250, 0.75), 0 0 16px rgba(139, 92, 246, 0.25)'
                      : hoveredField === 'direction'
                        ? '0 0 6px rgba(167, 139, 250, 0.6)'
                        : 'none',
                  }}
                  aria-hidden="true"
                />
              </div>
              <span
                className={`text-[9px] font-medium tracking-[0.2em] transition-colors duration-200 uppercase ${labelOpacity3}`}
              >
                Creative Direction
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
