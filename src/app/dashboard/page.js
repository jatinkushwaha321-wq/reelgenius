'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Shared UI Primitives
import StatusDot from '@/components/ui/StatusDot';
import SectionLabel from '@/components/ui/SectionLabel';
import PageFooter from '@/components/ui/PageFooter';
import ConfidenceMeter from '@/components/ui/ConfidenceMeter';

// Extracted Domain Modules (preserving original UI layout and component separation)
import StrategicNarrative from '@/components/dashboard/StrategicNarrative';
import SignalBriefing from '@/components/dashboard/SignalBriefing';

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

      {/* ---- Creator Intelligence Status Section ---- */}
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
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 flex flex-col gap-4">
            {!hasIntelligence ? (
              <p className="text-[14px] leading-relaxed text-white/40">
                NIVO has not yet received creator context for this environment.
                Intelligence surfaces will populate as signals are observed.
              </p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.02] pb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-white/80 uppercase tracking-widest">
                      Creator Intelligence Active
                    </span>
                    <span className="text-[11px] text-white/40">
                      Last refreshed on {new Date(profile.workspaceStats?.lastRefresh || profile.updatedAt || profile.analyzedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {profile.workspaceStats && (
                    <div className="flex items-center gap-2 shrink-0">
                      <ConfidenceMeter score={profile.workspaceStats.strategicConfidence} verdict="APPROVE" />
                    </div>
                  )}
                </div>
                
                {profile.workspaceStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/40">Active Signals</span>
                      <span className="text-xl font-semibold text-white/95 font-mono">{profile.workspaceStats.activeSignalsCount}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/40">Validated Principles</span>
                      <span className="text-xl font-semibold text-white/95 font-mono">{profile.workspaceStats.validatedPrinciplesCount}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/40">Strategic Status</span>
                      <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-violet-300/60 bg-violet-400/[0.04] border border-violet-400/[0.08] px-2.5 py-0.5 rounded w-fit mt-1 select-none">
                        Validated
                      </span>
                    </div>
                  </div>
                )}
                {allTrendsUnknown && !profile.workspaceStats && (
                  <span className="text-[11px] text-white/20">
                    Trend indicators are derived from repeated observations over time.
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* ---- Signals Section ---- */}
      {signalsState === 'loading' ? (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Signals
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex items-center justify-center min-h-[140px]">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        </section>
      ) : signalsState === 'error' ? (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Signals
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex flex-col gap-3 items-center justify-center min-h-[140px]">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              SIGNALS UNAVAILABLE
            </span>
            <span className="text-[11px] text-white/10 select-none">
              Creator Signals could not be loaded right now.
            </span>
          </div>
        </section>
      ) : (
        <SignalBriefing signals={signals} />
      )}

      {/* ---- Direction Section (The Narrative Layer) ---- */}
      {profileState === 'loading' ? (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Direction
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex items-center justify-center min-h-[100px]">
            <Loader2 className="h-5 w-5 animate-spin text-white/20" />
          </div>
        </section>
      ) : profileState === 'error' ? (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Direction
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex flex-col items-center justify-center min-h-[100px] gap-3">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              DIRECTION UNAVAILABLE
            </span>
            <span className="text-[11px] text-white/10 select-none">
              Creator direction could not be loaded right now.
            </span>
          </div>
        </section>
      ) : (
        <StrategicNarrative direction={profile ? profile.strategicDirection : ''} />
      )}

      <PageFooter segment="Overview" />
    </div>
  );
}
