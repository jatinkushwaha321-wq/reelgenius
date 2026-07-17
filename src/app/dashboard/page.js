'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function StatusDot({ color = 'violet', pulse = false }) {
  const colorClass = color === 'red' ? 'bg-red-400/60' : 'bg-violet-400/40';
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${colorClass} ${pulse ? 'animate-pulse' : ''} mr-2.5 align-middle`}
      aria-hidden="true"
    />
  );
}

function SectionLabel({ children }) {
  return (
    <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30 align-middle">
      {children}
    </span>
  );
}

function PageFooter() {
  return (
    <footer className="pt-4 border-t border-white/[0.03] mt-10">
      <div className="flex items-center gap-4 text-[9px] tracking-[0.18em] uppercase text-white/15 select-none">
        <span>NIVO v1</span>
        <span className="h-px w-3 bg-white/[0.06]" aria-hidden="true" />
        <span>Overview</span>
      </div>
    </footer>
  );
}

export default function OverviewPage() {
  // states: 'loading' | 'success' | 'error' | 'empty'
  const [profileState, setProfileState] = useState('loading');
  const [profile, setProfile] = useState(null);

  const [signalsState, setSignalsState] = useState('loading');
  const [signals, setSignals] = useState([]);

  const fetchOverviewData = useCallback(async () => {
    try {
      const [profileRes, signalsRes] = await Promise.allSettled([
        fetch('/api/profile'),
        fetch('/api/signals')
      ]);

      // Handle Profile
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const pJson = await profileRes.value.json();
        const pData = pJson.data?.profile;
        if (pData) {
          setProfile(pData);
          setProfileState('success');
        } else {
          setProfileState('empty');
        }
      } else {
        setProfileState('error');
      }

      // Handle Signals
      if (signalsRes.status === 'fulfilled' && signalsRes.value.ok) {
        const sJson = await signalsRes.value.json();
        const sData = sJson.data?.signals || [];
        setSignals(sData);
        setSignalsState(sData.length > 0 ? 'success' : 'empty');
      } else {
        setSignalsState('error');
      }

    } catch (err) {
      console.error('Overview fetch error:', err);
      setProfileState('error');
      setSignalsState('error');
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const hasIntelligence = profile && profile.analyzedAt && profile.aiSummary;
  const allTrendsUnknown = signals.length > 0 && signals.every(s => s.trend === 'unknown');

  return (
    <div className="flex flex-col gap-10 pt-2 min-w-0 w-full">
      {/* Workspace Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" />
            <SectionLabel>Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">Overview</h1>
          <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
            Current intelligence, active signals, and strategic direction.
          </p>
        </div>
      </section>

      {/* ---- Intelligence Status Territory ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Creator Intelligence Status
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {profileState === 'loading' && (
          <div className="flex items-center gap-3 text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">● Loading intelligence status</span>
          </div>
        )}

        {profileState === 'error' && (
          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] px-6 py-8 flex items-center justify-center min-h-[100px]">
             <span className="text-[11px] tracking-[0.15em] uppercase text-red-400/60 select-none">
               PROFILE REQUEST FAILED
             </span>
          </div>
        )}

        {(profileState === 'success' || profileState === 'empty') && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 flex flex-col gap-2">
            {!hasIntelligence ? (
              <p className="text-[14px] leading-relaxed text-white/40">
                NIVO has not yet received creator context for this environment.
                Intelligence surfaces will populate as signals are observed.
              </p>
            ) : (
              <>
                <span className="text-[13px] font-medium text-white/80 uppercase tracking-widest">
                  Creator Intelligence Active
                </span>
                <span className="text-[11px] text-white/40">
                  Synthesized on {new Date(profile.analyzedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {allTrendsUnknown && (
                  <span className="text-[11px] text-white/20">
                    Trend indicators are derived from repeated observations over time.
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ---- Signal Territory ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Signals
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {signalsState === 'loading' && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex items-center justify-center min-h-[140px]">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        )}

        {signalsState === 'error' && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex flex-col gap-3 items-center justify-center min-h-[140px]">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              SIGNALS UNAVAILABLE
            </span>
            <span className="text-[11px] text-white/10 select-none">
              Creator Signals could not be loaded right now.
            </span>
          </div>
        )}

        {signalsState === 'empty' && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex flex-col gap-3 items-center justify-center min-h-[140px]">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              AWAITING CREATOR SIGNAL
            </span>
            <span className="text-[11px] text-white/10 select-none">
              NIVO has not yet derived active creator patterns for this workspace.
            </span>
          </div>
        )}

        {signalsState === 'success' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.map((sig) => (
                <article key={sig.id} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[15px] font-medium text-white/90 leading-snug">
                      {sig.displayName}
                    </h3>
                    {sig.trend !== 'unknown' && (
                      <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-violet-300/60 bg-violet-400/[0.04] px-1.5 py-0.5 rounded shrink-0">
                        {sig.trend}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-white/[0.02] pt-3">
                    <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/50">Direction</span>
                    <p className="text-[14px] leading-relaxed text-white/75">
                      {sig.directionImplication}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            {allTrendsUnknown && (
              <span className="text-[11px] text-white/15 mt-3 select-none">
                Signal trends are computed from longitudinal observations.
              </span>
            )}
          </>
        )}
      </section>

      {/* ---- Direction Territory ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Direction
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {profileState === 'loading' && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex items-center justify-center min-h-[100px]">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        )}

        {profileState === 'error' && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex flex-col items-center justify-center min-h-[100px] gap-3">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              DIRECTION UNAVAILABLE
            </span>
            <span className="text-[11px] text-white/10 select-none">
              Creator direction could not be loaded right now.
            </span>
          </div>
        )}

        {(profileState === 'success' || profileState === 'empty') && (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex flex-col gap-6 min-h-[100px]">
            {!hasIntelligence ? (
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[60px]">
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
                  NO DIRECTION DERIVED
                </span>
                <span className="text-[11px] text-white/10 select-none">
                  NIVO has not yet formed a strategic direction from the current creator context.
                </span>
              </div>
            ) : !profile.strategicDirection ? (
              <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[60px]">
                <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
                  DIRECTION NOT YET DERIVED
                </span>
                <span className="text-[11px] text-white/10 select-none">
                  NIVO requires additional signal evidence to synthesize a strategic direction.
                </span>
              </div>
            ) : (
              <>
                <p className="text-[15px] leading-relaxed text-white/75 whitespace-pre-wrap">
                  {profile.strategicDirection}
                </p>
                <div className="pt-4 border-t border-white/[0.02] flex justify-end">
                  <Link
                    href="/dashboard/ideas"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all"
                  >
                    Explore Ideas <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <PageFooter />
    </div>
  );
}
