import { ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

/**
 * Section 02 — Creator Intelligence Narrative
 *
 * Explains how NIVO reads creator content:
 *   Signals → Pattern → Interpretation
 *
 * Enhanced with:
 *   - Proximity tracking for selected violet nodes using direct style variables
 *   - Signal Inspection hover interactions mapping rows to SVG paths and node sizes
 *   - Cursor-following surface light coordinates inside Creative Direction
 *   - Complete coarse-pointer fallback and reduced motion handling.
 */

const SIGNALS = [
  { name: 'Opening Motion', active: true, key: 'opening-motion' },
  { name: 'Subject Reveal', active: false, key: 'subject-reveal' },
  { name: 'Visual Contrast', active: false, key: 'visual-contrast' },
  { name: 'Pacing Shift', active: false, key: 'pacing-shift' },
];

export default function CreatorIntelligenceSection() {
  const [hoveredSignal, setHoveredSignal] = useState(null);
  const [readoutHovered, setReadoutHovered] = useState(false);
  const [cardHovered, setCardHovered] = useState(false);
  const [fieldHovered, setFieldHovered] = useState(false);

  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  // Proximity Node Refs
  const ui2aActiveDotRef = useRef(null);
  const ui2aPerceptionOpeningDotRef = useRef(null);
  const ui2bSynthesisNodeRef = useRef(null);
  const ui2bDetectedPatternDotRef = useRef(null);
  const ui2bActiveDot1Ref = useRef(null);
  const ui2bActiveDot2Ref = useRef(null);

  // Proximity Response effect (A category)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId;

    const handlePointerMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!window.matchMedia('(pointer: fine)').matches) return;

      const { clientX, clientY } = e;

      const nodes = [
        { ref: ui2aActiveDotRef, radius: 80 },
        { ref: ui2aPerceptionOpeningDotRef, radius: 120 },
        { ref: ui2bSynthesisNodeRef, radius: 140 },
        { ref: ui2bDetectedPatternDotRef, radius: 100 },
        { ref: ui2bActiveDot1Ref, radius: 80 },
        { ref: ui2bActiveDot2Ref, radius: 80 },
      ];

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        nodes.forEach(({ ref, radius }) => {
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
        const refs = [
          ui2aActiveDotRef,
          ui2aPerceptionOpeningDotRef,
          ui2bSynthesisNodeRef,
          ui2bDetectedPatternDotRef,
          ui2bActiveDot1Ref,
          ui2bActiveDot2Ref,
        ];
        refs.forEach((ref) => {
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

  // Cursor-following light effect (C category)
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
    <section
      ref={sectionRef}
      className="relative bg-[#06060e] noise-bg"
      aria-labelledby="section-creator-intelligence"
    >
      {/* ---- Transition rule from hero ---- */}
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
            02
          </span>
          <span className="h-px w-6 bg-white/10" aria-hidden="true" />
          <span
            className="text-[10px] font-medium tracking-[0.25em] text-white/30 uppercase"
            id="section-creator-intelligence"
          >
            Creator Intelligence
          </span>
        </div>

        {/* ---- Primary heading + supporting copy ---- */}
        <div className="max-w-4xl mb-20 md:mb-28">
          <h2
            className="
              text-[clamp(2rem,4.5vw,3.5rem)]
              font-bold leading-[1.08] tracking-tight
              text-white
              mb-8 md:mb-10
            "
          >
            NIVO sees
            <br />
            what you miss.
          </h2>

          <div className="max-w-lg">
            <p className="text-[15px] md:text-base leading-relaxed text-white/45">
              Your audience leaves signals in every pause, replay, save, and shift in attention.
            </p>
            <p className="text-[15px] md:text-base leading-relaxed text-white/45 mt-4">
              NIVO reads the patterns beneath those signals and turns them into creative understanding.
            </p>
          </div>
        </div>

        {/* ---- Signal → Perception → Interpretation composition ---- */}
        <div className="max-w-5xl">

          {/* ---- Signal Index + Perception Field (horizontal on desktop) ---- */}
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-[220px_1fr]
              lg:grid-cols-[260px_1fr]
              gap-10 md:gap-8 lg:gap-12
              mb-12 md:mb-16
            "
          >
            {/* ---- LEFT: Signal Index ---- */}
            <div>
              {/* Technical label */}
              <span
                className="text-[9px] font-medium tracking-[0.22em] text-white/30 uppercase block mb-6"
                aria-hidden="true"
              >
                Content Signal
              </span>

              {/* Signal list */}
              <ul className="space-y-3.5" role="list">
                {SIGNALS.map((signal) => (
                  <li key={signal.name} className="flex items-center gap-3">
                    {/* Active indicator with Proximity support */}
                    <span
                      ref={signal.active ? ui2aActiveDotRef : null}
                      className={`
                        h-1.5 w-1.5 rounded-full shrink-0 transition-transform duration-300 ease-out
                        ${signal.active ? 'bg-violet-400/70' : 'bg-white/10'}
                      `}
                      style={signal.active ? {
                        transform: 'scale(calc(1 + var(--signal-response, 0) * 0.3))',
                      } : undefined}
                      aria-hidden="true"
                    />
                    <span
                      className={`
                        text-[13px] tracking-wide
                        ${signal.active ? 'text-white/80 font-medium' : 'text-white/30 font-normal'}
                      `}
                    >
                      {signal.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ---- CENTER/RIGHT: Signal Perception Field ---- */}
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => setFieldHovered(true)}
              onMouseLeave={() => setFieldHovered(false)}
              aria-label="Signal perception field showing temporal relationship between Opening Motion and Subject Reveal"
            >

              {/* Atmospheric depth — very faint radial glow behind the field */}
              <div
                className="absolute inset-0 -inset-x-8 pointer-events-none transition-all duration-300"
                style={{
                  background: `radial-gradient(ellipse 65% 55% at 30% 45%, rgba(124, 58, 237, ${fieldHovered ? '0.08' : '0.06'}) 0%, transparent 65%)`,
                }}
                aria-hidden="true"
              />

              {/* Field container */}
              <div className="relative pt-2">

                {/* Temporal axis label */}
                <div className="flex items-center justify-between mb-8" aria-hidden="true">
                  <span className="text-[7px] font-medium tracking-[0.3em] text-white/15 uppercase">
                    Early
                  </span>
                  <div
                    className="flex-1 mx-4 h-px transition-colors duration-300"
                    style={{ backgroundColor: fieldHovered ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <span className="text-[7px] font-medium tracking-[0.3em] text-white/15 uppercase">
                    Late
                  </span>
                </div>

                {/* ---- Temporal traces ---- */}
                <div className="relative h-32 md:h-36">

                  {/* Background trace lines — faint horizontal depth */}
                  <div className="absolute inset-0 flex flex-col justify-between py-4" aria-hidden="true">
                    <div className="h-px w-full transition-colors duration-300" style={{ backgroundColor: fieldHovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.03)' }} />
                    <div className="h-px w-full transition-colors duration-300" style={{ backgroundColor: fieldHovered ? 'rgba(255, 255, 255, 0.055)' : 'rgba(255, 255, 255, 0.035)' }} />
                    <div className="h-px w-full transition-colors duration-300" style={{ backgroundColor: fieldHovered ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.03)' }} />
                  </div>

                  {/* ---- EVENT 1: Opening Motion (early, top) ---- */}
                  <div className="absolute top-3 left-[8%] md:left-[10%] flex items-center gap-3">
                    {/* Signal node with Proximity response */}
                    <div className="relative" aria-hidden="true">
                      <span
                        ref={ui2aPerceptionOpeningDotRef}
                        className="block h-2.5 w-2.5 rounded-full bg-violet-400/75 transition-transform duration-300 ease-out"
                        style={{
                          transform: 'scale(calc(1 + var(--signal-response, 0) * 0.25))',
                        }}
                      />
                      <span
                        className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-violet-400/30 transition-opacity duration-300 ease-out"
                        style={{
                          filter: 'blur(6px)',
                          transform: 'scale(calc(3 + var(--signal-response, 0) * 1.5))',
                          opacity: 'calc(1 + var(--signal-response, 0) * 0.8)',
                        }}
                      />
                    </div>
                    {/* Illuminated trace — short bright region */}
                    <div
                      className="w-20 md:w-28 h-px bg-gradient-to-r transition-all duration-300"
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(167, 139, 250, ${fieldHovered ? '0.62' : '0.45'}) 0%, transparent 100%)`,
                      }}
                      aria-hidden="true"
                    />
                    {/* Event label */}
                    <span className="text-[9px] md:text-[10px] font-medium tracking-[0.18em] text-white/65 uppercase whitespace-nowrap">
                      Opening Motion
                    </span>
                  </div>

                  {/* ---- Relationship trace — faint diagonal connection ---- */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* Soft glow behind the trace */}
                    <line
                      x1="18%" y1="22%"
                      x2="52%" y2="72%"
                      stroke={fieldHovered ? 'rgba(139, 92, 246, 0.10)' : 'rgba(139, 92, 246, 0.06)'}
                      strokeWidth="6"
                      style={{ filter: 'blur(4px)', transition: 'stroke 0.3s ease' }}
                    />
                    {/* Primary trace */}
                    <line
                      x1="18%" y1="22%"
                      x2="52%" y2="72%"
                      stroke={fieldHovered ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.15)'}
                      strokeWidth="1"
                      strokeDasharray="5 5"
                      style={{ transition: 'stroke 0.3s ease' }}
                    />
                    {/* Midpoint observation mark */}
                    <circle
                      cx="35%" cy="47%"
                      r="2"
                      fill={fieldHovered ? 'rgba(139, 92, 246, 0.40)' : 'rgba(139, 92, 246, 0.25)'}
                      style={{ transition: 'fill 0.3s ease' }}
                    />
                  </svg>

                  {/* ---- EVENT 2: Subject Reveal (later, bottom) ---- */}
                  <div className="absolute bottom-3 left-[45%] md:left-[48%] flex items-center gap-3">
                    {/* Signal node */}
                    <div className="relative" aria-hidden="true">
                      <span className="block h-2 w-2 rounded-full bg-white/45" />
                      <span
                        className="absolute inset-0 h-2 w-2 rounded-full bg-white/15"
                        style={{ filter: 'blur(4px)', transform: 'scale(2.5)' }}
                      />
                    </div>
                    {/* Faint trace */}
                    <div
                      className="w-14 md:w-20 h-px bg-gradient-to-r transition-all duration-300"
                      style={{
                        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, ${fieldHovered ? '0.35' : '0.25'}) 0%, transparent 100%)`,
                      }}
                      aria-hidden="true"
                    />
                    {/* Event label */}
                    <span className="text-[9px] md:text-[10px] font-medium tracking-[0.18em] text-white/45 uppercase whitespace-nowrap">
                      Subject Reveal
                    </span>
                  </div>

                  {/* ---- Observation marks — sparse analytical traces ---- */}
                  <div className="absolute top-1/2 right-[12%] md:right-[8%] -translate-y-1/2 flex flex-col items-end gap-1" aria-hidden="true">
                    <div className="h-px w-6 bg-white/[0.08]" />
                    <div className="h-px w-4 bg-white/[0.06]" />
                    <div className="h-px w-8 bg-white/[0.07]" />
                  </div>
                </div>

                {/* Detected relationship status */}
                <div className="flex items-center gap-2 mt-4" aria-hidden="true">
                  <span className="h-1 w-1 rounded-full bg-violet-400/50 animate-pulse" />
                  <span
                    className={`text-[8px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
                      fieldHovered ? 'text-white/48' : 'text-white/35'
                    }`}
                  >
                    Temporal Precedence Detected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Pattern Interpretation (below the field) ---- */}
          <div className="md:ml-[calc(260px+3rem)] lg:ml-[calc(260px+3rem)]">
            {/* Technical label */}
            <span
              className="text-[9px] font-medium tracking-[0.22em] text-white/30 uppercase block mb-6"
              aria-hidden="true"
            >
              Pattern 04
            </span>

            {/* Interpretation copy */}
            <p className="text-[15px] md:text-lg leading-relaxed text-white/80 max-w-md mb-8">
              Audience attention strengthens when visual movement precedes contextual reveal.
            </p>

            {/* Thin separator */}
            <div className="h-px w-12 bg-white/[0.08] mb-6" aria-hidden="true" />

            {/* Observed behavior */}
            <div>
              <span
                className="text-[9px] font-medium tracking-[0.22em] text-white/25 uppercase block mb-3"
                aria-hidden="true"
              >
                Observed Behavior
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                  Early Motion
                </span>
                <ArrowRight className="h-3 w-3 text-white/25" strokeWidth={2} />
                <span className="text-[12px] font-semibold tracking-[0.12em] text-white/55 uppercase">
                  Sustained Interest
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            UI-2b — Intelligence Synthesis
            Continuation of Section 02. Shows how isolated signals
            converge into creative direction.
            ================================================================ */}

        {/* ---- Subtle internal separator ---- */}
        <div className="mt-20 md:mt-24 lg:mt-28 mb-16 md:mb-20 lg:mb-24 max-w-5xl" aria-hidden="true">
          <div className="h-px w-20 bg-white/[0.06]" />
        </div>

        {/* ---- Synthesis heading + supporting copy ---- */}
        <div className="max-w-3xl mb-20 md:mb-24">
          <h3
            className="
              text-[clamp(1.75rem,3.8vw,2.75rem)]
              font-bold leading-[1.12] tracking-tight
              text-white
              mb-8 md:mb-10
            "
          >
            Signals become useful
            <br />
            <span
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              className="text-white/85"
            >
              when they connect.
            </span>
          </h3>

          <div className="max-w-lg space-y-4">
            <p className="text-[15px] md:text-base leading-relaxed text-white/45">
              A pause means little on its own.
              <br />
              A replay means little on its own.
            </p>
            <p className="text-[15px] md:text-base leading-relaxed text-white/45">
              NIVO connects behavior across your content to reveal the creative patterns shaping audience attention.
            </p>
          </div>
        </div>

        {/* ---- Synthesis composition: Signals → Synthesis → Interpretation → Direction ---- */}
        <div className="relative max-w-7xl w-full">

          {/* Connected SVG lines (Visible on large desktop only) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" aria-hidden="true">
            {/* Active Trace 1 Glow Path (Opening Motion) */}
            <path
              d="M 170,72 Q 230,72 276,101"
              stroke="rgba(139, 92, 246, 0.09)"
              strokeWidth="6"
              style={{
                filter: 'blur(4px)',
                opacity: hoveredSignal === 'opening-motion' ? 1.6 : 1,
                transition: 'opacity 0.3s ease',
              }}
              fill="none"
            />
            {/* Active Trace 1 Primary Path (Opening Motion, y=72) -> Synthesis Node (x=280, y=105) */}
            <path
              d="M 170,72 Q 230,72 276,101"
              stroke={`rgba(139, 92, 246, ${hoveredSignal === 'opening-motion' ? '0.58' : '0.40'})`}
              strokeWidth="1.3"
              style={{ transition: 'stroke 0.3s ease' }}
              fill="none"
            />

            {/* Active Trace 2 Glow Path (Replay Density) */}
            <path
              d="M 170,104 C 210,104 240,105 276,105"
              stroke="rgba(139, 92, 246, 0.07)"
              strokeWidth="6"
              style={{
                filter: 'blur(4px)',
                opacity: hoveredSignal === 'replay-density' ? 1.7 : 1,
                transition: 'opacity 0.3s ease',
              }}
              fill="none"
            />
            {/* Active Trace 2 Primary Path (Replay Density, y=104) -> Synthesis Node (x=280, y=105) */}
            <path
              d="M 170,104 C 210,104 240,105 276,105"
              stroke={`rgba(139, 92, 246, ${hoveredSignal === 'replay-density' ? '0.48' : '0.34'})`}
              strokeWidth="1.3"
              strokeDasharray="4 3"
              style={{ transition: 'stroke 0.3s ease' }}
              fill="none"
            />

            {/* Inactive Signal 3 Trace (Save Behavior, y=136) -> Synthesis Node */}
            <path
              d="M 170,136 Q 230,136 276,109"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
              fill="none"
            />
            {/* Inactive Signal 4 Trace (Pacing Shift, y=168) -> Synthesis Node */}
            <path
              d="M 170,168 Q 230,168 276,109"
              stroke="rgba(255, 255, 255, 0.07)"
              strokeWidth="1"
              fill="none"
            />

            {/* Outgoing flow trace: Synthesis Node (x=284, y=105) -> Interpretation Start (x=380, y=105) */}
            <path
              d="M 284,105 L 370,105"
              stroke={`rgba(139, 92, 246, ${
                hoveredSignal === 'opening-motion' || hoveredSignal === 'replay-density'
                  ? '0.40'
                  : readoutHovered
                  ? '0.42'
                  : '0.28'
              })`}
              strokeWidth="1.3"
              style={{ transition: 'stroke 0.3s ease' }}
              fill="none"
            />

            {/* Flow to Output trace: Interpretation End (x=680, y=105) -> Creative Direction Card Boundary (x=905, y=136) */}
            <path
              d="M 680,105 C 780,105 820,136 905,136"
              stroke={`rgba(139, 92, 246, ${
                cardHovered ? '0.30' : readoutHovered ? '0.26' : '0.18'
              })`}
              strokeWidth="1"
              strokeDasharray="5 5"
              style={{ transition: 'stroke 0.3s ease' }}
              fill="none"
            />
          </svg>

          {/* Grid Overlay with Content */}
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-[200px_160px_1fr_280px]
              gap-12 md:gap-x-12 md:gap-y-16 lg:gap-8 xl:gap-12
              relative z-10
              items-start
            "
          >
            {/* ---- TERRITORY 1: Observed Signals ---- */}
            <div className="col-span-1 pt-1">
              <span
                className="text-[9px] font-medium tracking-[0.22em] text-white/25 uppercase block mb-6"
                aria-hidden="true"
              >
                Observed Signals
              </span>

              <div className="space-y-4">
                {[
                  { name: 'Opening Motion', active: true, key: 'opening-motion' },
                  { name: 'Replay Density', active: true, key: 'replay-density' },
                  { name: 'Save Behavior', active: false, key: 'save-behavior' },
                  { name: 'Pacing Shift', active: false, key: 'pacing-shift' },
                ].map((signal, index) => (
                  <div
                    key={signal.name}
                    className="flex items-center gap-2.5 h-4 cursor-pointer group/row"
                    onMouseEnter={() => setHoveredSignal(signal.key)}
                    onMouseLeave={() => setHoveredSignal(null)}
                  >
                    <span
                      ref={index === 0 ? ui2bActiveDot1Ref : index === 1 ? ui2bActiveDot2Ref : null}
                      className={`h-1 w-1 rounded-full shrink-0 transition-transform duration-300 ease-out ${
                        signal.active ? 'bg-violet-400/60' : 'bg-white/10'
                      }`}
                      style={signal.active ? {
                        transform: `scale(calc(${hoveredSignal === signal.key ? '1.3' : '1'} + var(--signal-response, 0) * 0.3))`,
                      } : undefined}
                      aria-hidden="true"
                    />
                    <span
                      className={`text-[12px] tracking-[0.08em] uppercase transition-colors duration-300 ${
                        signal.active
                          ? hoveredSignal === signal.key
                            ? 'text-white font-medium'
                            : 'text-white/55 font-medium'
                          : hoveredSignal === signal.key
                          ? 'text-white/40 font-normal'
                          : 'text-white/25 font-normal'
                      }`}
                    >
                      {signal.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- TERRITORY 2: Central Synthesis Event ---- */}
            <div className="col-span-1 flex flex-col items-center lg:items-start lg:pt-20">
              <div className="relative flex items-center justify-center h-5 w-5">
                {/* Synthesis Node with Proximity + Hover mapping */}
                <span
                  ref={ui2bSynthesisNodeRef}
                  className="h-2 w-2 rounded-full bg-violet-400/80 relative z-10 transition-all duration-300 ease-out"
                  style={{
                    transform: `scale(calc(${(hoveredSignal === 'opening-motion' || hoveredSignal === 'replay-density') ? '1.2' : '1'} + var(--signal-response, 0) * 0.25))`,
                  }}
                  aria-hidden="true"
                />
                <span
                  className="absolute inset-0 h-2 w-2 rounded-full bg-violet-400/25 z-0 transition-all duration-300 ease-out"
                  style={{
                    filter: 'blur(5px)',
                    transform: `scale(calc(${(hoveredSignal === 'opening-motion' || hoveredSignal === 'replay-density') ? '4.5' : '3.5'} + var(--signal-response, 0) * 1.5))`,
                    opacity: (hoveredSignal === 'opening-motion' || hoveredSignal === 'replay-density') ? 0.45 : 0.25,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 text-center lg:text-left">
                <span className="text-[9px] font-medium tracking-[0.22em] text-white/30 uppercase block">
                  Synthesis 07
                </span>
                <span className="text-[9px] font-medium tracking-[0.15em] text-violet-400/50 uppercase block mt-1">
                  Relationship Detected
                </span>
              </div>
            </div>

            {/* ---- TERRITORY 3: Interpretation Readout ---- */}
            <div
              className="col-span-1 lg:pt-20 lg:pl-6 relative cursor-pointer"
              onMouseEnter={() => setReadoutHovered(true)}
              onMouseLeave={() => setReadoutHovered(false)}
            >
              {/* Horizontal rule with a tiny entry node implying connection from Synthesis */}
              <div className="flex items-center gap-2.5 mb-4" aria-hidden="true">
                {/* Entry node with Proximity + hover state */}
                <span
                  ref={ui2bDetectedPatternDotRef}
                  className="h-1.5 w-1.5 rounded-full bg-violet-400/65 shrink-0 transition-transform duration-300 ease-out"
                  style={{
                    transform: `scale(calc(${readoutHovered ? '1.25' : '1'} + var(--signal-response, 0) * 0.3))`,
                  }}
                />
                {/* Connection line segment */}
                <div
                  className="h-px w-5 transition-all duration-300"
                  style={{
                    backgroundColor: readoutHovered ? 'rgba(167, 139, 250, 0.4)' : 'rgba(167, 139, 250, 0.2)',
                  }}
                />
                {/* Micro-label */}
                <span
                  className={`text-[8.5px] font-medium tracking-[0.25em] transition-colors duration-300 uppercase ${
                    readoutHovered ? 'text-white/60' : 'text-white/35'
                  }`}
                >
                  Detected Pattern
                </span>
              </div>

              {/* Analytical layout containing text */}
              <div
                className="border-l border-white/[0.04] pl-4 transition-colors duration-300"
                style={{
                  borderColor: readoutHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                }}
              >
                <p className="text-[15px] md:text-base leading-relaxed text-white/70 max-w-sm">
                  Fast visual entry creates attention.
                  <br />
                  Delayed context creates curiosity.
                </p>

                {/* Trailing readout analytical line */}
                <div className="h-px w-8 bg-white/[0.04] mt-5" aria-hidden="true" />
              </div>
            </div>

            {/* ---- TERRITORY 4: Creative Direction (Output) ---- */}
            <div
              className="col-span-1 lg:pt-[136px]"
              onMouseEnter={() => setCardHovered(true)}
              onMouseLeave={() => setCardHovered(false)}
            >
              {/* Creative Direction — restrained glass surface with pointer light */}
              <div
                ref={cardRef}
                className="
                  nivo-glass-light
                  rounded-2xl
                  px-5 py-4
                  w-full
                  max-w-xs
                  relative
                  overflow-hidden
                "
                style={{
                  '--surface-x': '0px',
                  '--surface-y': '0px',
                  '--surface-presence': '0',
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

                <span
                  className="text-[9px] font-medium tracking-[0.22em] text-white/30 uppercase block mb-3 relative z-10"
                  aria-hidden="true"
                >
                  Creative Direction
                </span>

                <div className="space-y-2 relative z-10">
                  <p className="text-[13px] font-semibold tracking-wide text-white/80 uppercase">
                    Lead with motion
                  </p>
                  <p className="text-[13px] font-semibold tracking-wide text-white/80 uppercase">
                    Reveal context later
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
