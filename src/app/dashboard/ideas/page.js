'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Check, AlertCircle, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * Layout Primitives
 */
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
        <span>Ideas</span>
      </div>
    </footer>
  );
}

export default function IdeasPage() {
  // Page load and global state
  const [profileState, setProfileState] = useState('loading'); // loading | no_profile | intelligence_unavailable | ready
  const [profile, setProfile] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [loadError, setLoadError] = useState('');

  // Generation status state
  const [genStatus, setGenStatus] = useState('idle'); // idle | generating | success | error
  const [genError, setGenError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Card specific loading / error state maps
  const [cardActionStates, setCardActionStates] = useState({}); // { ideaId: 'saving' | 'dismissing' | 'idle' }
  const [cardErrors, setCardErrors] = useState({}); // { ideaId: 'error message' }
  const [scriptCache, setScriptCache] = useState({}); // { ideaId: Script }
  const [scriptGenerating, setScriptGenerating] = useState({}); // { ideaId: boolean }
  const [scriptMetadataError, setScriptMetadataError] = useState(false);

  const router = useRouter();

  // Cooldown timer interval ref
  const timerRef = useRef(null);

  // Cooldown calculator and timer trigger
  const triggerCooldownTimer = useCallback((latestGeneratedTime) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const checkCooldown = () => {
      const elapsed = Date.now() - latestGeneratedTime;
      const cooldownMs = 60000;
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 1000);
        setCooldownSeconds(remaining);
      } else {
        setCooldownSeconds(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };

    checkCooldown();
    timerRef.current = setInterval(checkCooldown, 1000);
  }, []);

  // Fetch Ideas and Profile
  const fetchWorkspaceData = useCallback(async () => {
    setLoadError('');
    try {
      // 1. Fetch Profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.status === 401) {
        setLoadError('Authentication expired. Please sign in again.');
        setProfileState('no_profile');
        return;
      }
      if (!profileRes.ok) {
        setLoadError('Failed to load profile context.');
        setProfileState('no_profile');
        return;
      }
      const profileJson = await profileRes.json();
      const userProfile = profileJson.data?.profile;

      if (!userProfile) {
        setProfileState('no_profile');
        return;
      }

      setProfile(userProfile);

      // Check intelligence configuration
      if (!userProfile.analyzedAt || !userProfile.niche) {
        setProfileState('intelligence_unavailable');
        return;
      }

      setProfileState('ready');

      // 2. Fetch Ideas
      const ideasRes = await fetch('/api/ideas');
      if (ideasRes.ok) {
        const ideasJson = await ideasRes.json();
        const allIdeas = ideasJson.data?.ideas || [];

        // Partition Ideas
        const candList = allIdeas.filter(idea => idea.status === 'candidate');
        const savedList = allIdeas.filter(idea => idea.status === 'idea');

        setCandidates(candList);
        setSavedIdeas(savedList);

        // Calculate latest generatedAt to trigger cooldown check if within 60 seconds
        const generatedIdeas = allIdeas.filter(idea => idea.generatedAt && idea.generationRunId);
        if (generatedIdeas.length > 0) {
          const latestTime = Math.max(...generatedIdeas.map(idea => new Date(idea.generatedAt).getTime()));
          const elapsed = Date.now() - latestTime;
          if (elapsed < 60000) {
            triggerCooldownTimer(latestTime);
          }
        }
      } else {
        setLoadError('Failed to load active content directions.');
      }

      // 3. Fetch Scripts (N+1 avoidance)
      try {
        const scriptsRes = await fetch('/api/scripts');
        if (scriptsRes.ok) {
          const scriptsJson = await scriptsRes.json();
          const scriptsList = scriptsJson.data?.scripts || [];
          const scriptMap = {};
          scriptsList.forEach(s => {
            scriptMap[s.sourceIdeaId] = s;
          });
          setScriptCache(scriptMap);
          setScriptMetadataError(false);
        } else {
          setScriptMetadataError(true);
        }
      } catch (scriptErr) {
        console.error('Failed to load Script metadata:', scriptErr);
        setScriptMetadataError(true);
      }

    } catch (err) {
      console.error('Failed to load NIVO workspace data:', err);
      setLoadError('Network error. Check your connection.');
      setProfileState('no_profile');
    }
  }, [triggerCooldownTimer]);

  useEffect(() => {
    fetchWorkspaceData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchWorkspaceData]);

  // Generate Ideas Trigger
  const handleGenerate = async () => {
    if (genStatus === 'generating' || cooldownSeconds > 0) return;
    setGenStatus('generating');
    setGenError('');

    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        // Map backend errors to clean user-facing labels
        const errCode = json.error?.code;
        let errMsg = json.message || 'Failed to synthesize content directions.';

        if (errCode === 'IDEA_GENERATION_IN_PROGRESS') {
          errMsg = 'A direction set is already being derived.';
        } else if (errCode === 'IDEA_GENERATION_COOLDOWN') {
          const retryAfter = json.error?.details?.retryAfter || 60;
          errMsg = `New directions can be derived in ${retryAfter} seconds.`;
          setCooldownSeconds(retryAfter);
          triggerCooldownTimer(Date.now() - (60 - retryAfter) * 1000);
        } else if (errCode === 'INSUFFICIENT_SIGNALS') {
          errMsg = 'NIVO needs stronger creator signals before deriving grounded ideas.';
        } else if (errCode === 'STALE_INTELLIGENCE') {
          errMsg = 'Creator profile intelligence is stale. Please re-run intelligence analysis on the Profile page first.';
        } else if (errCode === 'INTELLIGENCE_REQUIRED') {
          errMsg = 'Creator intelligence needs to be derived before generating directions.';
        } else if (errCode === 'PROVIDER_RATE_LIMIT' || errCode === 'LOCAL_RATE_LIMIT') {
          errMsg = 'The intelligence provider is temporarily rate limited. Please retry in a few minutes.';
        } else if (errCode === 'AUTHENTICATION_ERROR') {
          errMsg = 'API authentication failure with intelligence client.';
        }

        setGenError(errMsg);
        setGenStatus('error');
        return;
      }

      // Successful generation: Replace candidates immediately, update cooldown
      const newCandidates = json.data?.candidates || [];
      setCandidates(newCandidates);
      setGenStatus('success');

      // Trigger cooldown countdown
      triggerCooldownTimer(Date.now());
      setTimeout(() => setGenStatus('idle'), 3000);

    } catch (err) {
      setGenError('Network error. Failed to dispatch generation request.');
      setGenStatus('error');
    }
  };

  // Save/Accept candidate Idea
  const handleAccept = async (ideaId) => {
    setCardActionStates(prev => ({ ...prev, [ideaId]: 'saving' }));
    setCardErrors(prev => ({ ...prev, [ideaId]: '' }));

    try {
      const res = await fetch(`/api/ideas/${ideaId}/accept`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        const errCode = json.error?.code;
        let errMsg = json.message || 'Failed to save idea.';

        if (errCode === 'IDEA_NOT_CANDIDATE') {
          errMsg = 'This candidate is no longer active.';
          // Remove stale candidate from local state
          setCandidates(prev => prev.filter(c => c._id !== ideaId));
        } else if (errCode === 'IDEA_NOT_FOUND') {
          errMsg = 'Idea candidate not found.';
          setCandidates(prev => prev.filter(c => c._id !== ideaId));
        } else if (errCode === 'IDEA_ACCEPTANCE_MEMORY_ERROR') {
          // Re-fetch database state to reconcile partial failure
          errMsg = 'The idea was saved, but NIVO could not update recent generation memory.';
          await fetchWorkspaceData();
        }

        setCardErrors(prev => ({ ...prev, [ideaId]: errMsg }));
        setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));
        return;
      }

      // Success: Remove candidate, add saved idea
      const acceptedIdea = json.data?.idea;
      setCandidates(prev => prev.filter(c => c._id !== ideaId));
      if (acceptedIdea) {
        setSavedIdeas(prev => [acceptedIdea, ...prev]);
      }
      setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));

    } catch (err) {
      setCardErrors(prev => ({ ...prev, [ideaId]: 'Network error. Failed to save idea.' }));
      setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));
    }
  };

  // Dismiss candidate Idea
  const handleDismiss = async (ideaId) => {
    setCardActionStates(prev => ({ ...prev, [ideaId]: 'dismissing' }));
    setCardErrors(prev => ({ ...prev, [ideaId]: '' }));

    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        const errCode = json.error?.code;
        let errMsg = json.message || 'Failed to dismiss candidate.';

        if (errCode === 'IDEA_NOT_CANDIDATE' || errCode === 'IDEA_NOT_FOUND') {
          setCandidates(prev => prev.filter(c => c._id !== ideaId));
          return;
        }

        setCardErrors(prev => ({ ...prev, [ideaId]: errMsg }));
        setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));
        return;
      }

      // Success: remove locally
      setCandidates(prev => prev.filter(c => c._id !== ideaId));
      setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));

    } catch (err) {
      setCardErrors(prev => ({ ...prev, [ideaId]: 'Network error. Failed to dismiss candidate.' }));
      setCardActionStates(prev => ({ ...prev, [ideaId]: 'idle' }));
    }
  };

  const handleGenerateScript = async (ideaId) => {
    setScriptGenerating(prev => ({ ...prev, [ideaId]: true }));
    setCardErrors(prev => ({ ...prev, [ideaId]: '' }));
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      });
      const json = await res.json();
      if (!res.ok) {
        const code = json.error?.code;
        if (code === 'SCRIPT_HYGIENE_ERROR') {
          setCardErrors(prev => ({ ...prev, [ideaId]: 'Generated script was rejected for violating hygiene rules.' }));
        } else if (code === 'SCRIPT_FINALIZED' || code === 'SCRIPT_CONFLICT') {
          setCardErrors(prev => ({ ...prev, [ideaId]: 'Cannot overwrite finalized script.' }));
        } else {
          setCardErrors(prev => ({ ...prev, [ideaId]: json.message || 'Failed to generate script.' }));
        }
      } else {
        router.push(`/dashboard/scripts/${ideaId}`);
      }
    } catch (err) {
      setCardErrors(prev => ({ ...prev, [ideaId]: 'Network error generating script.' }));
    } finally {
      setScriptGenerating(prev => ({ ...prev, [ideaId]: false }));
    }
  };

  /* ================================================================
     RENDER STATES
     ================================================================ */

  // Global Loading State
  if (profileState === 'loading') {
    return (
      <div className="flex flex-col gap-10 pt-2">
        <section>
          <StatusDot color="violet" pulse />
          <SectionLabel>Workspace</SectionLabel>
          <div className="flex items-center gap-3 text-white/30 mt-5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">● Loading creative directions</span>
          </div>
        </section>
      </div>
    );
  }

  // No Profile Configured
  if (profileState === 'no_profile') {
    return (
      <div className="flex flex-col gap-8 pt-2 max-w-lg">
        <section>
          <StatusDot color="red" />
          <SectionLabel>Workspace</SectionLabel>
          <p className="text-[15px] leading-relaxed text-white/40 mt-5 mb-8">
            No creator profile configured. Provide the profile NIVO should observe on the Profile page to begin.
          </p>
          <a
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium tracking-[0.1em] uppercase rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white/80 hover:bg-white/[0.05] transition-all"
          >
            Go to Profile <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>
        {loadError && (
          <div className="flex items-center gap-2 text-red-400/60 text-[12px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}
      </div>
    );
  }

  // Intelligence Unavailable (Awaiting Synthesis)
  if (profileState === 'intelligence_unavailable') {
    return (
      <div className="flex flex-col gap-8 pt-2 max-w-lg">
        <section>
          <StatusDot color="violet" />
          <SectionLabel>Workspace</SectionLabel>
          <p className="text-[15px] leading-relaxed text-white/40 mt-5 mb-8">
            Creator intelligence needs to be derived before generating directions. Please run intelligence synthesis on the Profile page.
          </p>
          <a
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all"
          >
            Synthesize Intelligence <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>
      </div>
    );
  }

  const hasCandidates = candidates.length > 0;
  const hasSaved = savedIdeas.length > 0;

  return (
    <div className="flex flex-col gap-10 pt-2 min-w-0 w-full">
      {/* Workspace Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" pulse={genStatus === 'generating'} />
            <SectionLabel>Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">Ideas</h1>
          <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
            Content concepts and creative directions derived from observed creator signals and intelligence.
          </p>
        </div>

        {/* Generate Button Container */}
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={genStatus === 'generating' || cooldownSeconds > 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {genStatus === 'generating' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deriving directions…</span>
              </>
            ) : cooldownSeconds > 0 ? (
              <span>Wait {cooldownSeconds}s</span>
            ) : (
              <span>Generate Ideas</span>
            )}
          </button>

          {/* Cooldown or active lock message details */}
          {cooldownSeconds > 0 && (
            <span className="text-[10px] text-white/20 select-none">
              Cooldown active: {cooldownSeconds}s remaining
            </span>
          )}
        </div>
      </section>

      {/* Global Generation Error Display */}
      {genStatus === 'error' && genError && (
        <section className="rounded-lg border border-red-500/10 bg-red-500/[0.02] px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" />
          <span className="text-[12px] text-white/60 leading-relaxed">{genError}</span>
        </section>
      )}

      {/* Candidates Territory */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Active Candidates
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {!hasCandidates ? (
          /* Empty Candidates */
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-12 flex flex-col items-center justify-center min-h-[160px] text-center gap-3">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/20 select-none">
              {!hasSaved ? 'No directions generated yet' : 'No active candidates'}
            </span>
            <span className="text-[11px] text-white/10 max-w-sm select-none leading-relaxed">
              {!hasSaved 
                ? "NIVO uses your creator intelligence and current signals to derive grounded content directions."
                : "Generate a new set of directions when you're ready to explore what your current intelligence supports."}
            </span>
          </div>
        ) : (
          /* Candidates list (single-column stack for editorial readability) */
          <div className="flex flex-col gap-6">
            {candidates.map((cand) => {
              const isSaving = cardActionStates[cand._id] === 'saving';
              const isDismissing = cardActionStates[cand._id] === 'dismissing';
              const isPending = isSaving || isDismissing;
              const cardError = cardErrors[cand._id];

              return (
                <article
                  key={cand._id}
                  className={`rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 sm:p-6 flex flex-col gap-4 transition-opacity ${
                    isPending ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {/* Metadata header */}
                  <div className="flex items-center justify-between text-[9px] tracking-[0.15em] uppercase text-white/30 font-medium">
                    <div>
                      {cand.contentPillar && <span>{cand.contentPillar}</span>}
                      {cand.contentPillar && cand.format && <span className="mx-2">/</span>}
                      {cand.format && <span>{cand.format}</span>}
                    </div>
                    {cand.topic && (
                      <span className="text-violet-300/40 bg-violet-400/[0.02] px-2 py-0.5 rounded border border-violet-400/[0.05]">
                        {cand.topic}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-base sm:text-lg font-medium text-white/95 leading-snug">
                    {cand.title}
                  </h2>

                  {/* Hook Suggestion */}
                  {cand.hook && (
                    <div className="border-l border-violet-400/20 bg-violet-400/[0.01] px-4 py-2 text-[14px] italic text-white/70 leading-relaxed font-serif">
                      {cand.hook}
                    </div>
                  )}

                  {/* Concept description */}
                  {cand.description && (
                    <p className="text-[15px] leading-[1.65] text-white/65">
                      {cand.description}
                    </p>
                  )}

                  {/* Grounded Reasoning block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/[0.02]">
                    {/* Why this fits you */}
                    {cand.directionSnapshot && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/50">Why this fits you</span>
                        <p className="text-[14px] leading-relaxed text-white/75">
                          {cand.directionSnapshot}
                        </p>
                      </div>
                    )}

                    {/* Why now */}
                    {cand.whyNow && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/50">Signal context</span>
                        <p className="text-[14px] leading-relaxed text-white/75">
                          {cand.whyNow}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Novelty Angle or signal snapshots if available */}
                  {cand.sourceSignalSnapshots && cand.sourceSignalSnapshots.length > 0 && (
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.02]">
                      <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Supported by</span>
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/60">
                        {cand.sourceSignalSnapshots.slice(0, 2).map((sig, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-white/80 font-medium">{sig.displayName}</span>
                            <span className="h-px w-2 bg-white/10" />
                            <span className="text-[9px] tracking-[0.12em] font-mono text-violet-300/70 bg-violet-400/[0.04] px-1 rounded uppercase">
                              {sig.trend}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card level Error territory */}
                  {cardError && (
                    <div className="rounded-lg border border-red-500/10 bg-red-500/[0.02] px-3.5 py-2.5 flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400/60 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-white/50 leading-relaxed">{cardError}</span>
                    </div>
                  )}

                  {/* Candidate Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.02] mt-1">
                    <button
                      onClick={() => handleDismiss(cand._id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-medium tracking-[0.08em] uppercase rounded border border-white/[0.06] bg-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isDismissing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => handleAccept(cand._id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-medium tracking-[0.08em] uppercase rounded border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      <span>{isSaving ? 'Using Idea...' : 'Use This Idea'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Saved Ideas Territory */}
      <section className="flex flex-col gap-5 pt-4">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Your Ideas
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        {!hasSaved ? (
          /* Empty Saved Ideas */
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex items-center justify-center min-h-[90px] text-center">
            <span className="text-[11px] tracking-[0.12em] text-white/10 select-none">
              Choose an idea direction to keep developing it.
            </span>
          </div>
        ) : (
          /* Saved list (Visually quieter, compact list) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedIdeas.map((idea) => (
              <article
                key={idea._id}
                className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3"
              >
                {/* Metadata */}
                <div className="flex items-center gap-2 text-[8px] tracking-[0.15em] uppercase text-white/30">
                  {idea.contentPillar && <span>{idea.contentPillar}</span>}
                  {idea.contentPillar && idea.format && <span>/</span>}
                  {idea.format && <span>{idea.format}</span>}
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-medium text-white/90 leading-snug">
                  {idea.title}
                </h3>

                {/* Hook (restrained) */}
                {idea.hook && (
                  <div className="border-l border-white/10 pl-3 py-0.5 text-[13px] italic text-white/50 leading-relaxed font-serif">
                    {idea.hook}
                  </div>
                )}

                {/* Concept */}
                {idea.description && (
                  <p className="text-[14px] leading-relaxed text-white/60">
                    {idea.description}
                  </p>
                )}

                {/* Script Actions & Review Panel */}
                <div className="pt-3 border-t border-white/[0.02] mt-2 flex items-center justify-between">
                  {cardErrors[idea._id] && (
                    <div className="rounded border border-red-500/10 bg-red-500/[0.02] px-3 py-1.5 flex items-start gap-2 mb-2 w-full">
                      <AlertCircle className="h-3.5 w-3.5 text-red-400/60 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-white/50 leading-relaxed">{cardErrors[idea._id]}</span>
                    </div>
                  )}
                  
                  {scriptMetadataError ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-white/40 font-medium uppercase tracking-[0.1em]">
                        SCRIPT STATUS UNAVAILABLE
                      </span>
                    </div>
                  ) : !scriptCache[idea._id] ? (
                    <button
                      onClick={() => handleGenerateScript(idea._id)}
                      disabled={scriptGenerating[idea._id]}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-medium tracking-[0.1em] uppercase rounded border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {scriptGenerating[idea._id] && <Loader2 className="h-3 w-3 animate-spin" />}
                      {scriptGenerating[idea._id] ? 'Generating...' : 'Generate Script'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-white/50 font-medium">
                        {scriptCache[idea._id].status === 'final' ? 'Final' : 'Draft'}
                        {scriptCache[idea._id].estimatedDurationSeconds != null && ` · ${scriptCache[idea._id].estimatedDurationSeconds} sec`}
                        {scriptCache[idea._id].totalWordCount != null && ` · ${scriptCache[idea._id].totalWordCount} words`}
                      </span>
                      <Link
                        href={`/dashboard/scripts/${idea._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-medium tracking-[0.1em] uppercase rounded border border-white/[0.06] bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all cursor-pointer"
                      >
                        Open Script
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <PageFooter />
    </div>
  );
}
