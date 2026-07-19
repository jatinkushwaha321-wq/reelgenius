import React from 'react';

/**
 * SignalBriefing - Reverted to baseline visual design.
 * Renders the Signals list section matching NIVO's original UI.
 * 
 * @param {Object} props
 * @param {Array} props.signals - The array of Signal objects
 */
export default function SignalBriefing({ signals = [] }) {
  const hasSignals = signals && signals.length > 0;

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
        <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
          Signals
        </span>
        <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
      </div>

      {!hasSignals ? (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex flex-col gap-3 items-center justify-center min-h-[140px]">
          <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
            AWAITING CREATOR SIGNAL
          </span>
          <span className="text-[11px] text-white/10 select-none">
            NIVO has not yet derived active creator patterns for this workspace.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((sig) => (
            <article 
              key={sig.id || sig._id} 
              className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[15px] font-medium text-white/90 leading-snug">
                  {sig.displayName}
                </h3>
                {sig.trend && sig.trend !== 'unknown' && (
                  <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-violet-300/60 bg-violet-400/[0.04] px-1.5 py-0.5 rounded shrink-0">
                    {sig.trend}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1 border-t border-white/[0.02] pt-3">
                <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/50">
                  Direction
                </span>
                <p className="text-[14px] leading-relaxed text-white/75">
                  {sig.directionImplication}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
