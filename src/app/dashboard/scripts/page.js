'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, ArrowRight, FileText } from 'lucide-react';
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

export default function ScriptsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scripts, setScripts] = useState([]);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/scripts');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Authentication expired. Please sign in again.');
        } else {
          setError('Failed to load scripts.');
        }
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setScripts(json.data?.scripts || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load scripts:', err);
      setError('Network error. Check your connection.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pt-2">
        <section>
          <StatusDot color="violet" pulse />
          <SectionLabel>Workspace</SectionLabel>
          <div className="flex items-center gap-3 text-white/30 mt-5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">● Loading scripts</span>
          </div>
        </section>
      </div>
    );
  }

  const drafts = scripts.filter(s => s.status === 'draft');
  const finals = scripts.filter(s => s.status === 'final');
  const hasScripts = scripts.length > 0;

  return (
    <div className="flex flex-col gap-10 pt-2 min-w-0 w-full pb-20">
      {/* Workspace Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" />
            <SectionLabel>Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">Scripts</h1>
          <p className="text-[13px] text-white/40 mt-1.5 max-w-md leading-relaxed">
            Your library of generated short-form content scripts.
          </p>
        </div>
      </section>

      {error && (
        <section className="rounded-lg border border-red-500/10 bg-red-500/[0.02] px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" />
          <span className="text-[12px] text-white/60 leading-relaxed">{error}</span>
        </section>
      )}

      {!hasScripts && !error && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-12 flex flex-col items-center justify-center min-h-[160px] text-center gap-5">
          <FileText className="h-8 w-8 text-white/10" strokeWidth={1} />
          <div className="flex flex-col gap-2">
            <span className="text-[12px] tracking-[0.15em] uppercase text-white/30 select-none font-medium">
              Scripts start from ideas you choose to develop.
            </span>
            <span className="text-[12px] text-white/20 select-none">
              Generate directions from your intelligence to begin.
            </span>
          </div>
          <Link
            href="/dashboard/ideas"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all cursor-pointer"
          >
            Go to Ideas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {hasScripts && (
        <div className="flex flex-col gap-10">
          {/* Drafts */}
          {drafts.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
                <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
                  Drafts
                </span>
                <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drafts.map(script => <ScriptCard key={script._id} script={script} />)}
              </div>
            </section>
          )}

          {/* Finals */}
          {finals.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="h-px flex-1 max-w-[32px] bg-white/[0.06]" aria-hidden="true" />
                <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
                  Final Scripts
                </span>
                <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finals.map(script => <ScriptCard key={script._id} script={script} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ScriptCard({ script }) {
  const isFinal = script.status === 'final';
  
  return (
    <article className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3 transition-colors hover:bg-white/[0.02]">
      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[8px] tracking-[0.15em] uppercase text-white/30">
          {script.ideaSnapshot?.contentPillar && <span>{script.ideaSnapshot.contentPillar}</span>}
          {script.ideaSnapshot?.contentPillar && script.ideaSnapshot?.format && <span>/</span>}
          {script.ideaSnapshot?.format && <span>{script.ideaSnapshot.format}</span>}
        </div>
        <span className={`text-[9px] font-medium tracking-widest uppercase px-2 py-1 border rounded ${isFinal ? 'text-violet-300/60 bg-violet-400/[0.03] border-violet-400/[0.05]' : 'text-white/40 bg-white/[0.03] border-white/[0.05]'}`}>
          {isFinal ? 'FINAL SCRIPT' : 'DRAFT SCRIPT'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-medium text-white/90 leading-snug">
        {script.ideaSnapshot?.title || 'Untitled Idea'}
      </h3>

      {/* Topic */}
      {script.ideaSnapshot?.topic && (
        <div className="text-[12px] text-white/50 mt-1">
          <span className="text-violet-300/60 bg-violet-400/[0.03] px-2.5 py-1 rounded border border-violet-400/[0.08]">
            {script.ideaSnapshot.topic}
          </span>
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.02] mt-3">
        <div className="flex items-center gap-3 text-[11px] text-white/50 font-medium">
          {script.estimatedDurationSeconds != null && <span>{script.estimatedDurationSeconds}s est.</span>}
          {script.totalWordCount != null && <span>{script.totalWordCount} words</span>}
        </div>
        <Link
          href={`/dashboard/scripts/${script.sourceIdeaId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium tracking-[0.1em] uppercase rounded border border-white/[0.06] bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all cursor-pointer"
        >
          <span>Open Script</span>
        </Link>
      </div>
    </article>
  );
}
