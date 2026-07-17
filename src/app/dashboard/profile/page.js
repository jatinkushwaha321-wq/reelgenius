'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, AlertCircle, AtSign } from 'lucide-react';

/**
 * NIVO Profile — Creator Source Identity & Observation
 *
 * DASH-2A / INGEST-1B:
 * The creator provides ONLY their Instagram username as the observation source.
 * Triggering observation invokes the POST /api/observe endpoint, running
 * the Apify scraper and persisting factual public details & content.
 */
export default function ProfilePage() {
  const [state, setState] = useState('loading'); // loading | empty | existing | error
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | success | error
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Observation state
  const [observeStatus, setObserveStatus] = useState('idle'); // idle | observing | success | error
  const [observeError, setObserveError] = useState('');

  // Intelligence state
  const [intelStatus, setIntelStatus] = useState('idle'); // idle | analyzing | success | error
  const [intelError, setIntelError] = useState('');

  /* ---- Fetch profile on mount ---- */
  const fetchProfile = useCallback(async () => {
    setState('loading');
    setLoadError('');
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        setLoadError('Authentication expired. Please sign in again.');
        setState('error');
        return;
      }
      if (!res.ok) {
        setLoadError('Failed to load profile. Please try again.');
        setState('error');
        return;
      }
      const json = await res.json();
      if (json.data?.profile) {
        setProfile(json.data.profile);
        setUsername(json.data.profile.instagramUsername || '');
        setState('existing');
      } else {
        setState('empty');
      }
    } catch {
      setLoadError('Network error. Please check your connection.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ---- Save / Update Username ---- */
  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed || saveStatus === 'saving') return;
    setSaveStatus('saving');
    setSaveError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramUsername: trimmed }),
      });
      const json = await res.json();

      if (!res.ok) {
        setSaveError(json?.message || 'Save failed. Please try again.');
        setSaveStatus('error');
        return;
      }

      if (json.data?.profile) {
        setProfile(json.data.profile);
        setUsername(json.data.profile.instagramUsername || trimmed);
      }
      setState('existing');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2200);
    } catch {
      setSaveError('Network error. Please check your connection.');
      setSaveStatus('error');
    }
  };

  /* ---- Trigger Observation ---- */
  const handleObserve = async () => {
    if (observeStatus === 'observing') return;
    setObserveStatus('observing');
    setObserveError('');

    try {
      const res = await fetch('/api/observe', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        setObserveError(json?.message || 'Observation failed. Please try again.');
        setObserveStatus('error');
        return;
      }

      // Re-fetch profile to load newly observed factual fields (displayName, bio, stats)
      await fetchProfile();
      setObserveStatus('success');
      setTimeout(() => setObserveStatus('idle'), 3000);
    } catch {
      setObserveError('Network error. Please check your connection.');
      setObserveStatus('error');
    }
  };

  /* ---- Trigger Intelligence Synthesis ---- */
  const handleDeriveIntelligence = async () => {
    if (intelStatus === 'analyzing') return;
    setIntelStatus('analyzing');
    setIntelError('');

    try {
      const res = await fetch('/api/intelligence/analyze', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        setIntelError(json?.message || 'Intelligence synthesis failed. Please try again.');
        setIntelStatus('error');
        return;
      }

      // Re-fetch profile to load newly derived intelligence fields
      await fetchProfile();
      setIntelStatus('success');
      setTimeout(() => setIntelStatus('idle'), 3000);
    } catch {
      setIntelError('Network error. Please check your connection.');
      setIntelStatus('error');
    }
  };

  /* ================================================================
     RENDER
     ================================================================ */

  /* Loading */
  if (state === 'loading') {
    return (
      <div className="flex flex-col gap-10 pt-2">
        <section>
          <StatusDot color="violet" pulse />
          <SectionLabel>Creator Context</SectionLabel>
          <div className="flex items-center gap-3 text-white/30 mt-5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">Retrieving creator profile…</span>
          </div>
        </section>
      </div>
    );
  }

  /* Error */
  if (state === 'error') {
    return (
      <div className="flex flex-col gap-10 pt-2">
        <section>
          <StatusDot color="red" />
          <SectionLabel>Creator Context</SectionLabel>
          <div className="flex items-center gap-3 mt-5 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400/70" />
            <span className="text-[13px] text-white/50">{loadError}</span>
          </div>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 text-[12px] tracking-wide rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            Retry
          </button>
        </section>
      </div>
    );
  }

  /* Empty — No Profile configured */
  if (state === 'empty') {
    return (
      <div className="flex flex-col gap-10 pt-2 pb-20">
        {/* Workspace Header */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2.5">
              <StatusDot color="violet" />
              <SectionLabel>Creator Intelligence</SectionLabel>
            </div>
            <h1 className="text-xl font-semibold text-white/90">Creator Profile</h1>
            <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
              NIVO&apos;s current understanding of your niche, voice, audience, and content positioning.
            </p>
          </div>
        </section>

        <section>
          <p className="text-[15px] leading-relaxed text-white/60 max-w-lg mt-2 mb-8">
            NIVO begins with your public creator presence.
            Provide the profile NIVO should observe.
          </p>
        </section>

        {/* Username Entry */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Instagram Profile
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>

          <div className="max-w-sm">
            <div className="flex items-center gap-0 rounded-lg border border-white/[0.06] bg-white/[0.025] overflow-hidden focus-within:border-violet-400/30 focus-within:shadow-[0_0_0_2px_rgba(167,139,250,0.08)] transition-all">
              <span className="pl-3 pr-1 text-white/20 shrink-0 select-none">
                <AtSign className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.slice(0, 30));
                  setSaveStatus('idle');
                  setSaveError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="username"
                maxLength={30}
                autoFocus
                className="flex-1 bg-transparent py-2.5 pr-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!username.trim() || saveStatus === 'saving'}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saveStatus === 'saving' ? 'Saving…' : 'Begin Observation'}
            </button>

            {saveStatus === 'error' && (
              <p className="mt-3 text-[11px] text-red-400/70">{saveError}</p>
            )}
          </div>
        </section>

        <PageFooter />
      </div>
    );
  }

  /* Existing Profile */
  const hasObservation = !!(
    profile?.displayName ||
    profile?.bio ||
    profile?.followerCount > 0
  );

  return (
    <div className="flex flex-col gap-10 pt-2 pb-20">
      {/* Workspace Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" />
            <SectionLabel>Creator Intelligence</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">Creator Profile</h1>
          <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
            NIVO&apos;s evolving understanding of your niche, voice, audience, and content positioning.
          </p>
        </div>
      </section>

      {/* Configured Source */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Source Identity
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        <div className="max-w-sm">
          <div className="flex items-center gap-0 rounded-lg border border-white/[0.06] bg-white/[0.025] overflow-hidden focus-within:border-violet-400/30 focus-within:shadow-[0_0_0_2px_rgba(167,139,250,0.08)] transition-all">
            <span className="pl-3 pr-1 text-white/20 shrink-0 select-none">
              <AtSign className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.slice(0, 30));
                setSaveStatus('idle');
                setSaveError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="username"
              maxLength={30}
              className="flex-1 bg-transparent py-2.5 pr-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none"
            />
          </div>

          {/* Save / update username */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={!username.trim() || saveStatus === 'saving' || username.trim().toLowerCase() === profile?.instagramUsername}
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
              {saveStatus === 'success' && <Check className="h-3 w-3" />}
              {saveStatus === 'saving'
                ? 'Updating…'
                : saveStatus === 'success'
                  ? 'Updated'
                  : 'Update Source'}
            </button>

            {saveStatus === 'error' && (
              <span className="text-[11px] text-red-400/70">{saveError}</span>
            )}
          </div>
        </div>
      </section>

      {/* Observation Trigger Panel */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
          <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
            Observation Status
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 max-w-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-white/80">
                {observeStatus === 'observing' && 'Observing public presence…'}
                {observeStatus === 'success' && 'Observation completed.'}
                {observeStatus === 'error' && 'Observation failed.'}
                {observeStatus === 'idle' && (hasObservation ? 'Public presence observed.' : 'Awaiting observation.')}
              </span>
              <span className="text-[11px] text-white/40">
                {observeStatus === 'observing'
                  ? 'NIVO is gathering public profile details and recent content feed items.'
                  : observeStatus === 'success'
                    ? 'Successfully gathered and stored latest factual profile context.'
                    : observeStatus === 'error'
                      ? observeError
                      : hasObservation
                        ? 'Profile facts and recent content items are persisted in NIVO.'
                        : 'NIVO requires observation to populate creator profile facts.'}
              </span>
            </div>

            <button
              onClick={handleObserve}
              disabled={observeStatus === 'observing'}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 align-self-start md:align-self-center"
            >
              {observeStatus === 'observing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {observeStatus === 'success' && <Check className="h-3.5 w-3.5" />}
              {observeStatus === 'observing'
                ? 'Observing…'
                : observeStatus === 'success'
                  ? 'Completed'
                  : hasObservation
                    ? 'Refresh Observation'
                    : 'Observe Presence'}
            </button>
          </div>
        </div>
      </section>

      {/* Observed Profile Facts */}
      {hasObservation && (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Observed Evidence
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
            {/* Stats Card */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-4">
              <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Profile Metrics</span>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/40">Followers</span>
                  <span className="text-white/80 font-mono">{profile.followerCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/40">Following</span>
                  <span className="text-white/80 font-mono">{profile.followingCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-white/40">Total Posts</span>
                  <span className="text-white/80 font-mono">{profile.postCount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Profile Identity Card */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-2.5 md:col-span-2">
              <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Factual Identity</span>
              {profile.displayName && (
                <div className="text-[13px] font-medium text-white/85">{profile.displayName}</div>
              )}
              {profile.bio && (
                <div className="text-[12px] leading-relaxed text-white/50 whitespace-pre-wrap">{profile.bio}</div>
              )}
              {profile.category && (
                <div className="text-[11px] text-violet-300/60 mt-1">Category: {profile.category}</div>
              )}
              {profile.externalUrl && (
                <div className="text-[11px] text-white/35 mt-1 overflow-hidden text-ellipsis">
                  Link: <a href={profile.externalUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400/70 hover:underline">{profile.externalUrl}</a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Creator Intelligence Section */}
      {hasObservation && (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
            <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
              Creator Intelligence
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
          </div>

          {!profile.analyzedAt || !profile.niche ? (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-6 max-w-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] font-medium text-white/80">
                    {intelStatus === 'analyzing' && 'Synthesizing creative direction…'}
                    {intelStatus === 'success' && 'Intelligence derived successfully.'}
                    {intelStatus === 'error' && 'Synthesis failed.'}
                    {intelStatus === 'idle' && 'Awaiting creator intelligence.'}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {intelStatus === 'analyzing'
                      ? 'NIVO is processing profile metadata and observed content to derive intelligence.'
                      : intelStatus === 'success'
                        ? 'Creative context and signal definitions have been successfully persisted.'
                        : intelStatus === 'error'
                          ? intelError
                          : 'Profile observations exist. Trigger synthesis to derive creator intelligence.'}
                  </span>
                </div>

                <button
                  onClick={handleDeriveIntelligence}
                  disabled={intelStatus === 'analyzing'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 align-self-start md:align-self-center"
                >
                  {intelStatus === 'analyzing' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {intelStatus === 'success' && <Check className="h-3.5 w-3.5" />}
                  {intelStatus === 'analyzing'
                    ? 'Analyzing…'
                    : intelStatus === 'success'
                      ? 'Completed'
                      : 'Derive Intelligence'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 max-w-3xl">
              {/* Intelligence Header */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-white/85 flex items-center gap-2">
                      <StatusDot color="violet" />
                      Creator Intelligence Active
                    </span>
                    <span className="text-[11px] text-white/35">
                      Synthesized on {new Date(profile.analyzedAt).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-white/15">
                      NIVO&apos;s understanding evolves with each observation cycle.
                    </span>
                  </div>
                  
                  <button
                    onClick={handleDeriveIntelligence}
                    disabled={intelStatus === 'analyzing'}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-medium tracking-[0.1em] uppercase rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 align-self-start md:align-self-center"
                  >
                    {intelStatus === 'analyzing' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {intelStatus === 'success' && <Check className="h-3 w-3" />}
                    {intelStatus === 'analyzing' ? 'Analyzing…' : 'Re-derive Intelligence'}
                  </button>
                </div>
                {intelStatus === 'error' && (
                  <p className="mt-3 text-[11px] text-red-400/70">{intelError}</p>
                )}
              </div>

              {/* Intelligence Derived Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Niche & Positioning Card */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-4">
                  <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Niche positioning</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Primary Niche</span>
                      <span className="text-[15px] leading-relaxed text-white/85 font-medium">{profile.niche || 'Derivation unavailable'}</span>
                    </div>

                    {profile.subNiches && profile.subNiches.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Sub-Niches</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.subNiches.map((sub, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-medium text-white/70 bg-white/[0.04] border border-white/[0.08] rounded">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.postingFrequency && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Posting cadence</span>
                        <span className="text-[14px] leading-[1.65] text-white/75">{profile.postingFrequency}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Content format</span>
                      {profile.contentFormats && profile.contentFormats.length > 0 ? (
                        <ul className="list-disc pl-5 text-[14px] leading-[1.65] text-white/75 flex flex-col gap-1.5 mt-1">
                          {profile.contentFormats.map((fmt, i) => (
                            <li key={i}>
                              {fmt.label} ({fmt.percentage}%)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="list-disc pl-5 text-[14px] leading-[1.65] text-white/75 flex flex-col gap-1.5 mt-1">
                          <li>Primary: Reels</li>
                          <li>Secondary: Carousels</li>
                          <li>Occasional: Static Posts</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Brand Identity Card */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-4">
                  <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Brand voice & values</span>
                  <div className="flex flex-col gap-4">
                    {profile.brandIdentity?.tone && profile.brandIdentity.tone.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Tone Profile</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.brandIdentity.tone.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 text-[11px] font-medium text-white/70 bg-white/[0.04] border border-white/[0.08] rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.brandIdentity?.values && profile.brandIdentity.values.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Observed Core Values</span>
                        <ul className="list-disc pl-5 text-[14px] leading-[1.65] text-white/75 flex flex-col gap-1.5 mt-1">
                          {profile.brandIdentity.values.map((val, i) => (
                            <li key={i}>{val}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {profile.brandIdentity?.uniqueSellingPoints && profile.brandIdentity.uniqueSellingPoints.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Unique Selling Points</span>
                        <ul className="list-disc pl-5 text-[14px] leading-[1.65] text-white/75 flex flex-col gap-1.5 mt-1">
                          {profile.brandIdentity.uniqueSellingPoints.map((usp, i) => (
                            <li key={i}>{usp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audience Behavior Card */}
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-4 md:col-span-2">
                  <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Audience observations</span>
                  <div className="flex flex-col gap-5">
                    {profile.audiencePersona?.behaviorProfile && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Engagement behavior</span>
                        <p className="text-[14px] leading-[1.65] text-white/75">{profile.audiencePersona.behaviorProfile}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                      {profile.audiencePersona?.interests && profile.audiencePersona.interests.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Inferred Interests</span>
                          <div className="flex flex-wrap gap-2">
                            {profile.audiencePersona.interests.map((interest, i) => (
                              <span key={i} className="px-2.5 py-1 text-[11px] font-medium text-white/70 bg-white/[0.04] border border-white/[0.06] rounded">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.audiencePersona?.painPoints && profile.audiencePersona.painPoints.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Potential Pain Points</span>
                          <div className="flex flex-wrap gap-2">
                            {profile.audiencePersona.painPoints.map((pain, i) => (
                              <span key={i} className="px-2.5 py-1 text-[11px] font-medium text-red-300/80 bg-red-400/[0.05] border border-red-400/[0.15] rounded">
                                {pain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Content Pillars Card */}
                {profile.contentPillars && profile.contentPillars.length > 0 && (
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-4 md:col-span-2">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Estimated content mix</span>
                    <div className="flex flex-col gap-3">
                      {profile.contentPillars.map((pillar, i) => (
                        <div key={i} className="flex justify-between items-start gap-4 pb-3 border-b border-white/[0.02] last:border-b-0 last:pb-0">
                          <div className="flex flex-col gap-1">
                            <span className="text-[14px] font-medium text-white/90">{pillar.name}</span>
                            {pillar.description && (
                              <p className="text-[13px] leading-[1.65] text-white/50">{pillar.description}</p>
                            )}
                          </div>
                          {typeof pillar.percentage === 'number' && pillar.percentage > 0 && (
                            <span className="text-[11px] font-mono text-violet-300/70 bg-violet-400/[0.05] px-2 py-0.5 rounded border border-violet-400/[0.08] shrink-0">
                              {pillar.percentage}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Holistic AI Summary */}
                {profile.aiSummary && (
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-2.5 md:col-span-2">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-white/30">AI Strategy summary</span>
                    <p className="text-[14px] leading-[1.65] text-white/70 whitespace-pre-wrap">{profile.aiSummary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <PageFooter />
    </div>
  );
}

/* ================================================================
   Layout Primitives
   ================================================================ */

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
    <footer className="pt-4 border-t border-white/[0.03]">
      <div className="flex items-center gap-4 text-[9px] tracking-[0.18em] uppercase text-white/15 select-none">
        <span>NIVO v1</span>
        <span className="h-px w-3 bg-white/[0.06]" aria-hidden="true" />
        <span>Profile</span>
      </div>
    </footer>
  );
}
