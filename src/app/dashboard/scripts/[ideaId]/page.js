'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
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

export default function ScriptWorkspacePage({ params }) {
  const { ideaId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [script, setScript] = useState(null);
  
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const fetchScript = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/scripts?ideaId=${ideaId}`);
      if (!res.ok) {
        setError('Failed to load script workspace.');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setScript(json.data?.script || null);
    } catch (err) {
      console.error('Failed to load script:', err);
      setError('Network error loading workspace.');
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    fetchScript();
  }, [fetchScript]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
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
          setError('Generated script was rejected for violating hygiene rules.');
        } else if (code === 'SCRIPT_FINALIZED' || code === 'SCRIPT_CONFLICT') {
          setError('Cannot overwrite finalized script.');
          await fetchScript(); 
        } else {
          setError(json.message || 'Failed to generate script.');
        }
      } else {
        setScript(json.data);
      }
    } catch (err) {
      setError('Network error generating script.');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!script) return;
    setFinalizing(true);
    setError('');
    try {
      const res = await fetch(`/api/scripts/${script._id}/finalize`, {
        method: 'POST'
      });
      const json = await res.json();
      
      if (!res.ok) {
        if (json.error?.code === 'SCRIPT_FINALIZATION_MEMORY_ERROR') {
          setError('Script saved as final, but NIVO memory update failed.');
          await fetchScript();
        } else if (json.error?.code === 'SCRIPT_NOT_DRAFT') {
           setError('Script is no longer a draft.');
           await fetchScript();
        } else {
          setError(json.message || 'Failed to finalize script.');
        }
      } else {
        setScript(json.data?.script);
      }
    } catch (err) {
      setError('Network error finalizing script.');
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 pt-2">
        <section>
          <StatusDot color="violet" pulse />
          <SectionLabel>Script Workspace</SectionLabel>
          <div className="flex items-center gap-3 text-white/30 mt-5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">● Loading script workspace</span>
          </div>
        </section>
      </div>
    );
  }

  const isFinal = script?.status === 'final';

  return (
    <div className="flex flex-col gap-10 pt-2 min-w-0 w-full max-w-4xl pb-24">
      {/* Back Navigation */}
      <nav>
        <Link 
          href="/dashboard/scripts" 
          className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.1em] uppercase text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Scripts
        </Link>
      </nav>

      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-white/5 pb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <StatusDot color="violet" />
            <SectionLabel>Script Workspace</SectionLabel>
          </div>
          <h1 className="text-xl font-semibold text-white/90">
            {script ? (script.ideaSnapshot?.title || 'Untitled Script') : 'Script Workspace'}
          </h1>
          {script && (
            <div className="flex items-center gap-3 mt-3 text-[12px] text-white/40">
              <span className={`px-2.5 py-1 uppercase tracking-widest text-[9px] font-medium border rounded ${isFinal ? 'text-violet-300/80 bg-violet-400/[0.08] border-violet-400/[0.15]' : 'text-white/60 bg-white/[0.05] border-white/10'}`}>
                {isFinal ? 'FINAL SCRIPT' : 'DRAFT SCRIPT'}
              </span>
              <span>{script.estimatedDurationSeconds} sec</span>
              <span>•</span>
              <span>{script.totalWordCount} words</span>
            </div>
          )}
        </div>
        
        {script && !isFinal && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating || finalizing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-white/[0.08] bg-transparent text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
            <button
              onClick={handleFinalize}
              disabled={generating || finalizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Use This Script
            </button>
          </div>
        )}
      </section>

      {error && (
        <section className="rounded-lg border border-red-500/10 bg-red-500/[0.02] px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" />
          <span className="text-[13px] text-white/60 leading-relaxed">{error}</span>
        </section>
      )}

      {/* No Script State */}
      {!script && !error && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-16 flex flex-col items-center justify-center min-h-[200px] text-center gap-5">
          <span className="text-[12px] tracking-[0.15em] uppercase text-white/30 select-none font-medium">
            No script exists for this idea yet.
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {generating ? 'Generating Script...' : 'Generate Script'}
          </button>
        </div>
      )}

      {/* Script Render */}
      {script && (
        <div className="flex flex-col gap-12">
          
          {/* Hook */}
          {script.hook && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] tracking-widest uppercase text-violet-300/60 font-semibold">Hook</span>
              <p className="text-[17px] leading-[1.65] text-white/90 font-medium">{script.hook}</p>
            </div>
          )}

          {/* Beats */}
          <div className="flex flex-col gap-8">
            {script.beats.map((beat) => (
              <div key={beat.order} className="flex gap-4 sm:gap-6 border-l-2 border-white/[0.04] pl-4 py-1">
                <span className="text-white/20 font-mono text-lg shrink-0 w-6 leading-none pt-1">
                  {beat.order.toString().padStart(2, '0')}
                </span>
                
                <div className="flex flex-col gap-5 flex-1 min-w-0">
                  {/* Spoken content */}
                  {beat.spokenContent && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] tracking-widest uppercase text-white/50 font-medium">Spoken</span>
                      <p className="text-[16px] text-white/90 leading-[1.65] font-medium">
                        {beat.spokenContent}
                      </p>
                    </div>
                  )}
                  
                  {/* On-screen text */}
                  {beat.onScreenText && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[12px] tracking-widest uppercase text-violet-300/50 font-medium">On Screen</span>
                      <p className="text-[15px] text-violet-300/80 leading-[1.65]">
                        {beat.onScreenText}
                      </p>
                    </div>
                  )}

                  {/* Visual Context */}
                  {beat.visualNote && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12px] tracking-widest uppercase text-white/50 font-medium">Visual Direction</span>
                      <p className="text-[15px] text-white/60 italic leading-[1.65]">
                        {beat.visualNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA & Caption */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-white/[0.04]">
            {script.cta && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] tracking-widest uppercase text-white/50 font-medium">CTA</span>
                <p className="text-[15px] text-white/80 leading-[1.65]">{script.cta}</p>
              </div>
            )}
            
            {script.caption && (
              <div className="flex flex-col gap-1.5 pt-4 border-t border-white/5">
                <span className="text-[12px] tracking-widest uppercase text-white/50 font-medium">Caption</span>
                <p className="text-[15px] text-white/70 leading-[1.65] whitespace-pre-wrap">{script.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
