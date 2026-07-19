'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Shared UI Primitives
import StatusDot from '@/components/ui/StatusDot';
import SectionLabel from '@/components/ui/SectionLabel';
import PageFooter from '@/components/ui/PageFooter';
import EvidenceCitation from '@/components/ui/EvidenceCitation';

export default function StrategyPage() {
  const formatSummaryAsBullets = (text) => {
    if (!text) return null;
    const items = text.split(/(?<=\.)\s+/).map(s => s.trim()).filter(s => s.length > 0);
    return (
      <ul className="list-none flex flex-col gap-3">
        {items.map((item, idx) => (
          <li key={idx} className="text-[14px] leading-relaxed text-white/70 flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/40 mt-2 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Page states
  const [profileState, setProfileState] = useState('loading'); // loading | success | empty | error
  const [profile, setProfile] = useState(null);

  const [signalsState, setSignalsState] = useState('loading'); // loading | success | empty | error
  const [signals, setSignals] = useState([]);

  const [knowledgeState, setKnowledgeState] = useState('loading'); // loading | success | empty | error
  const [knowledgeItems, setKnowledgeItems] = useState([]);

  // Expandable UI states
  const [expandedSignalId, setExpandedSignalId] = useState(null);
  const [expandedKnowledgeId, setExpandedKnowledgeId] = useState(null);
  const [isNarrativeExpanded, setIsNarrativeExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setProfileState('loading');
    setSignalsState('loading');
    setKnowledgeState('loading');

    try {
      const [profileRes, signalsRes, knowledgeRes] = await Promise.allSettled([
        fetch('/api/profile'),
        fetch('/api/signals'),
        fetch('/api/knowledge')
      ]);

      // Process profile
      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const pJson = await profileRes.value.json();
        if (pJson.data?.profile) {
          setProfile(pJson.data.profile);
          setProfileState('success');
        } else {
          setProfileState('empty');
        }
      } else {
        setProfileState('error');
      }

      // Process signals
      if (signalsRes.status === 'fulfilled' && signalsRes.value.ok) {
        const sJson = await signalsRes.value.json();
        const sData = sJson.data?.signals || [];
        setSignals(sData);
        setSignalsState(sData.length > 0 ? 'success' : 'empty');
      } else {
        setSignalsState('error');
      }

      // Process knowledge base
      if (knowledgeRes.status === 'fulfilled' && knowledgeRes.value.ok) {
        const kJson = await knowledgeRes.value.json();
        const kData = kJson.data?.items || [];
        setKnowledgeItems(kData);
        setKnowledgeState(kData.length > 0 ? 'success' : 'empty');
      } else {
        setKnowledgeState('error');
      }

    } catch (err) {
      console.error('[Strategy] Fetch error:', err);
      setProfileState('error');
      setSignalsState('error');
      setKnowledgeState('error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasIntelligence = profile && profile.analyzedAt && profile.aiSummary;

  // ----------------------------------------------------------------
  // RENDER STATES: Loading
  // ----------------------------------------------------------------
  const isLoading = profileState === 'loading' || signalsState === 'loading' || knowledgeState === 'loading';
  const isError = profileState === 'error' && signalsState === 'error';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-10 pt-2 w-full">
        {/* Workspace Title Header */}
        <section className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <StatusDot color="violet" pulse />
            <SectionLabel>Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/95 mt-1.5">Strategy</h1>
        </section>
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-white/30">
          <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          <span className="text-[13px]">● Assembling strategic overview</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER STATES: Error Page Recovery
  // ----------------------------------------------------------------
  if (isError) {
    return (
      <div className="flex flex-col gap-8 pt-6 max-w-md mx-auto items-center text-center justify-center min-h-[400px]">
        <AlertCircle className="h-10 w-10 text-red-400/80" strokeWidth={1.5} />
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-white/90">Strategy Data Unavailable</h2>
          <p className="text-[13px] text-white/40 leading-relaxed">
            NIVO was unable to read the active strategic plan and signal feeds from your workspace context.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-nivo-wide uppercase rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 hover:text-white/90 hover:bg-white/[0.05] transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // RENDER STATES: Empty / Onboarding State
  // ----------------------------------------------------------------
  if (profileState === 'empty' || !hasIntelligence) {
    return (
      <div className="flex flex-col gap-10 pt-2 w-full max-w-2xl mx-auto">
        <section className="flex flex-col gap-1 items-center text-center pt-10">
          <div className="flex items-center gap-2">
            <StatusDot color="amber" pulse />
            <SectionLabel>Onboarding Required</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/95 mt-2">Awaiting Strategy Analysis</h1>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-sm mt-3">
            NIVO requires baseline creator observation and intelligence synthesis to map your strategy.
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-[11px] font-medium tracking-nivo-wide uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all"
          >
            Go to Profile <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
        <PageFooter segment="Strategy" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pt-2 min-w-0 w-full pb-20">
      {/* Workspace Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" />
            <SectionLabel>Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">Strategy</h1>
          <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
            NIVO&apos;s current understanding of your niche, brand positioning, and active audience signals.
          </p>
        </div>
      </section>

      {/* ---- Section 1: Strategic Diagnosis ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Strategic Diagnosis
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-4">
          {/* Overarching Strategic Summary */}
          {profile.aiSummary && (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">AI Key Findings</span>
              {formatSummaryAsBullets(profile.aiSummary)}
            </div>
          )}

          {/* Positioning Thesis & Goal */}
          {profile.strategicDirection && (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Positioning Thesis</span>
              <div className="text-[14.5px] leading-relaxed text-white/70">
                <p className="inline">
                  {isNarrativeExpanded ? profile.strategicDirection : `${profile.strategicDirection.split(/(?<=\.)\s+/).slice(0, 2).join(' ')}...`}
                </p>
                
                {profile.strategicDirection.split(/(?<=\.)\s+/).length > 2 && (
                  <button
                    onClick={() => setIsNarrativeExpanded(!isNarrativeExpanded)}
                    className="inline-flex items-center gap-1.5 ml-2 text-[10px] font-medium tracking-nivo-wide uppercase text-violet-400 hover:text-violet-300 transition-colors cursor-pointer select-none"
                  >
                    {isNarrativeExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ---- Section 2: Audience Persona & Tensions ---- */}
      {(profile.audiencePersona?.behaviorProfile || profile.audiencePersona?.painPoints?.length > 0) && (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Audience Persona & Tensions
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Behavior Profile */}
            {profile.audiencePersona?.behaviorProfile && (
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-2.5">
                <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Engagement Behavior</span>
                <p className="text-[13.5px] leading-[1.6] text-white/60">
                  {profile.audiencePersona.behaviorProfile}
                </p>
              </div>
            )}

            {/* Potential Pain Points */}
            {profile.audiencePersona?.painPoints && profile.audiencePersona.painPoints.length > 0 && (
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-2.5">
                <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Audience Pain Points</span>
                <div className="flex flex-wrap gap-2">
                  {profile.audiencePersona.painPoints.map((pain, i) => (
                    <span key={i} className="px-3 py-1.5 text-[11px] font-medium text-nivo-warning bg-nivo-warning-muted border-nivo-warning-border rounded">
                      {pain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inferred Interests */}
            {profile.audiencePersona?.interests && profile.audiencePersona.interests.length > 0 && (
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-2.5">
                <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Inferred Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.audiencePersona.interests.map((interest, i) => (
                    <span key={i} className="px-2 py-1 text-[11px] font-medium text-white/60 bg-white/[0.03] border border-white/[0.05] rounded">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- Section 3: Active Signals & Evidence ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Active Signals & Evidence
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {signalsState !== 'success' ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex items-center justify-center min-h-[100px] text-white/20 select-none">
            <span className="text-[12px] tracking-[0.12em] uppercase text-white/15">No Active Signals Derived</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {signals.map((sig) => {
              const hasEvidence = (sig.strength != null && sig.strength > 0) || 
                                  (sig.confidence != null && sig.confidence > 0) || 
                                  (sig.observationHistory && sig.observationHistory.length > 0);
              const isExpanded = hasEvidence && expandedSignalId === (sig.id || sig._id);
              return (
                <article 
                  key={sig.id || sig._id}
                  className={`rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3 transition-all ${
                    hasEvidence ? 'cursor-pointer hover:bg-white/[0.015]' : ''
                  }`}
                  onClick={hasEvidence ? () => setExpandedSignalId(isExpanded ? null : (sig.id || sig._id)) : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[15px] font-medium text-white/90 leading-snug">
                        {sig.displayName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {sig.trend && sig.trend !== 'unknown' && (() => {
                        let badgeClass = 'text-white/50 bg-white/[0.02] border-white/[0.05]';
                        let label = sig.trend;
                        
                        if (sig.trend === 'rising') {
                          if (sig.strength >= 75) {
                            badgeClass = 'text-violet-300 bg-violet-400/[0.06] border-violet-400/[0.15]';
                            label = 'Emerging';
                          } else {
                            badgeClass = 'text-nivo-success bg-nivo-success-muted border-green-500/10';
                            label = 'Growing';
                          }
                        } else if (sig.trend === 'stable') {
                          badgeClass = 'text-white/60 bg-white/[0.03] border-white/[0.08]';
                          label = 'Stable';
                        } else if (sig.trend === 'falling') {
                          badgeClass = 'text-nivo-warning bg-nivo-warning-muted border-nivo-warning-border';
                          label = 'Declining';
                        }
                        
                        return (
                          <span className={`text-[9px] font-medium tracking-[0.12em] uppercase px-2 py-0.5 rounded border ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                      {hasEvidence && (isExpanded ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1 border-t border-white/[0.02] pt-3">
                    <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-white/40">Directional Implication</span>
                    <p className="text-[13.5px] leading-relaxed text-white/70">
                      {sig.directionImplication}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/[0.02] flex flex-col gap-3 text-[12px] text-white/50 leading-relaxed bg-white/[0.005] p-3 rounded-lg">
                      {sig.observationHistory && sig.observationHistory.length > 0 && (
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>Analyzed Source Posts</span>
                          <span className="font-mono text-white/80">{sig.observationHistory.length} posts</span>
                        </div>
                      )}
                      {sig.strength != null && sig.strength > 0 && (
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>Observation Strength</span>
                          <span className="font-mono text-white/80">{sig.strength}%</span>
                        </div>
                      )}
                      {sig.confidence != null && sig.confidence > 0 && (
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span>Confidence Level</span>
                          <span className="font-mono text-white/80">{sig.confidence}%</span>
                        </div>
                      )}
                      {sig.observationHistory && sig.observationHistory.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[10px] font-medium uppercase text-white/35">Evidence Citations ({sig.observationHistory.length})</span>
                          <div className="flex flex-col gap-1 mt-1 pl-2 border-l border-white/[0.04]">
                            {sig.observationHistory.slice(0, 3).map((obs, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-white/40">
                                <span className="truncate max-w-[200px]">{obs.title || 'Observed Content Post'}</span>
                                <span className="font-mono text-white/30">{new Date(obs.timestamp).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- Section 4: Validated Knowledge Principles ---- */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Validated Knowledge base
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {knowledgeState !== 'success' ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-10 flex flex-col items-center justify-center text-center gap-3 min-h-[120px] select-none">
            <Database className="h-5 w-5 text-white/20" strokeWidth={1.5} />
            <span className="text-[11.5px] tracking-nivo-wide uppercase text-white/40 font-medium">
              NIVO Learning Context
            </span>
            <span className="text-[12.5px] text-white/30 max-w-md leading-relaxed px-4">
              NIVO is still learning from your decisions. Validated principles will appear here as your creative cycles accumulate.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {knowledgeItems.map((item) => {
              const isExpanded = expandedKnowledgeId === item._id;
              return (
                <article 
                  key={item._id}
                  className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3 transition-all cursor-pointer hover:bg-white/[0.015]"
                  onClick={() => setExpandedKnowledgeId(isExpanded ? null : item._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-nivo-success shrink-0" />
                        <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-violet-300/60 bg-violet-400/[0.04] px-2 py-0.5 rounded border border-violet-400/[0.08] select-none">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[14px] font-medium leading-relaxed text-white/90">
                        {item.normalizedStatement}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/[0.02] flex flex-col gap-3 text-[12px] text-white/50 leading-relaxed bg-white/[0.005] p-3 rounded-lg">
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span>Confidence Strength</span>
                        <span className="font-mono text-white/80">{item.strengthMetrics?.strength || 0}%</span>
                      </div>
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span>Support / Contradiction counts</span>
                        <span className="font-mono text-white/80">
                          {item.strengthMetrics?.supportCount || 0} supports · {item.strengthMetrics?.contradictionCount || 0} contradictions
                        </span>
                      </div>
                      {item.evidenceReferences && item.evidenceReferences.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <span className="text-[10px] font-medium uppercase text-white/35">Evidence Trail ({item.evidenceReferences.length})</span>
                          <div className="flex flex-col gap-1 mt-1 pl-2 border-l border-l-white/[0.04]">
                            {item.evidenceReferences.map((ev, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-white/40">
                                <span>{ev.ideaTitle}</span>
                                <span className="font-mono text-white/30 lowercase">{ev.verdict}D</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <PageFooter segment="Strategy" />
    </div>
  );
}
