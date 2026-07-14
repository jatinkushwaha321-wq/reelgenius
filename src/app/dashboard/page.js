'use client';

/**
 * NIVO Overview — Intelligence Surface Foundation
 *
 * DASH-1: Shell foundation only.
 * No database reads. No fake signals. No mock intelligence.
 *
 * This page establishes the spatial composition and atmospheric
 * presence of the Overview surface. Intelligence regions will be
 * populated by subsequent milestones as real data becomes available.
 */
export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-10 pt-2">

      {/* ---- Intelligence Status Territory ---- */}
      <section>
        {/* System status label */}
        <div className="flex items-center gap-2.5 mb-5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-violet-400/40"
            aria-hidden="true"
          />
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30">
            Intelligence Status
          </span>
        </div>

        {/* Status message */}
        <p className="text-[15px] leading-relaxed text-white/40 max-w-lg">
          NIVO has not yet received creator context for this environment.
          Intelligence surfaces will populate as signals are observed.
        </p>
      </section>

      {/* ---- Signal Territory (reserved) ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Signals
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {/* Empty signal field — atmospheric placeholder, not a loading skeleton */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex items-center justify-center min-h-[140px]">
          <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
            Awaiting creator signal
          </span>
        </div>
      </section>

      {/* ---- Direction Territory (reserved) ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Direction
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex items-center justify-center min-h-[100px]">
          <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
            No direction derived
          </span>
        </div>
      </section>

      {/* ---- Environment Metadata ---- */}
      <footer className="pt-4 border-t border-white/[0.03]">
        <div className="flex items-center gap-4 text-[9px] tracking-[0.18em] uppercase text-white/15 select-none">
          <span>NIVO v1</span>
          <span className="h-px w-3 bg-white/[0.06]" aria-hidden="true" />
          <span>Overview</span>
        </div>
      </footer>
    </div>
  );
}
