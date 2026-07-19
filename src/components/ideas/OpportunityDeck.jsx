import React, { useState } from 'react';
import { Loader2, Trash2, Plus, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EvaluatorDetails from './EvaluatorDetails';
import RejectionDrawer from './RejectionDrawer';

/**
 * OpportunityDeck - Presentation UI Component
 * Renders candidate opportunity cards using a clean, storytelling visual hierarchy and progressive evidence disclosure.
 * 
 * @param {Object} props
 * @param {Array} props.candidates - Candidate opportunities array
 * @param {Object} props.cardActionStates - Map of active save/dismiss loading states
 * @param {Object} props.cardErrors - Map of card action error messages
 * @param {Function} props.onAccept - Callback when accepting an opportunity
 * @param {Function} props.onDismiss - Callback when dismissing an opportunity
 */
export default function OpportunityDeck({
  candidates = [],
  cardActionStates = {},
  cardErrors = {},
  onAccept,
  onDismiss,
}) {
  const getFriendlyWhyNow = (text) => {
    if (!text) {
      return "This recommendation is based on early audience patterns. NIVO will become more confident as it learns from additional content.";
    }
    
    const lowercaseText = text.toLowerCase();
    
    // Check for internal engineering terms
    if (
      lowercaseText.includes('insufficient') ||
      lowercaseText.includes('longitudinal') ||
      lowercaseText.includes('observation pattern') ||
      lowercaseText.includes('confidence internals') ||
      lowercaseText.includes('placeholder')
    ) {
      return "This recommendation is based on early audience patterns. NIVO will become more confident as it learns from additional content.";
    }
    
    // Replace internal terms with clean, creator-facing equivalents
    let cleanText = text;
    cleanText = cleanText.replace(/longitudinal history/gi, 'audience patterns over time');
    cleanText = cleanText.replace(/observation pattern/gi, 'content patterns');
    cleanText = cleanText.replace(/insufficient evidence/gi, 'early audience indicators');
    
    return cleanText;
  };

  // Track active feedback drawer card ID
  const [activeFeedbackId, setActiveFeedbackId] = useState(null);

  // Track expanded supporting evidence card ID (progressive disclosure)
  const [expandedEvidenceId, setExpandedEvidenceId] = useState(null);

  const hasCandidates = candidates.length > 0;

  if (!hasCandidates) return null;

  return (
    <div className="flex flex-col gap-5">
      {candidates.map((cand) => {
        const isSaving = cardActionStates[cand._id] === 'saving';
        const isDismissing = cardActionStates[cand._id] === 'dismissing';
        const isPending = isSaving || isDismissing;
        const cardError = cardErrors[cand._id];
        const isFeedbackOpen = activeFeedbackId === cand._id;
        const isEvidenceExpanded = expandedEvidenceId === cand._id;

        return (
          <article
            key={cand._id}
            className={`rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col gap-3.5 transition-all duration-200 ${
              isPending ? 'opacity-40' : 'opacity-100'
            } hover:border-violet-500/20 hover:bg-white/[0.015] hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.06)]`}
          >
            {/* 1. Category Tagline Header */}
            <div className="flex items-center justify-between text-[8px] tracking-[0.15em] uppercase text-white/20 font-medium">
              <div>
                {cand.contentPillar && <span>{cand.contentPillar}</span>}
                {cand.contentPillar && cand.format && <span className="mx-1.5">/</span>}
                {cand.format && <span>{cand.format}</span>}
              </div>
              {cand.topic && (
                <span className="text-violet-300/30 bg-violet-400/[0.01] px-2 py-0.5 rounded border border-violet-400/[0.04]">
                  {cand.topic}
                </span>
              )}
            </div>

            {/* 2. Title */}
            <h2 className="text-base sm:text-[17px] font-medium text-white/90 leading-snug">
              {cand.title}
            </h2>

            {/* 3. Hook suggestion */}
            {cand.hook && (
              <div className="border-l border-white/10 bg-white/[0.005] px-3.5 py-1.5 text-[13.5px] italic text-white/50 leading-relaxed font-serif">
                {cand.hook}
              </div>
            )}

            {/* 4. Concept description */}
            {cand.description && (
              <p className="text-[13.5px] leading-relaxed text-white/55">
                {cand.description}
              </p>
            )}

            {/* 5. Why This Fits You (Promoted AI Insight with Left Accent indicator) */}
            {cand.directionSnapshot && (
              <div className="border-l-2 border-l-violet-500/80 bg-violet-400/[0.03] border-t border-r border-b border-white/[0.02] p-3 flex flex-col gap-1 rounded-r-lg">
                <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-violet-300">Why this fits you</span>
                <p className="text-[13px] leading-relaxed text-white/85">
                  {cand.directionSnapshot}
                </p>
              </div>
            )}

            {/* Card level error alerts */}
            {cardError && (
              <div className="rounded-lg border border-red-500/10 bg-red-500/[0.02] px-3.5 py-2.5 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-400/60 shrink-0 mt-0.5" />
                <span className="text-[11px] text-white/50 leading-relaxed">{cardError}</span>
              </div>
            )}

            {/* 6. Primary Action Bar */}
            {!isFeedbackOpen && (
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.02] mt-1 select-none">
                <button
                  onClick={() => setActiveFeedbackId(cand._id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-medium tracking-[0.05em] uppercase rounded border border-white/[0.05] bg-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
                <button
                  onClick={() => onAccept(cand._id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-medium tracking-[0.05em] uppercase rounded border border-violet-400/20 bg-violet-400/[0.06] text-violet-300 hover:bg-violet-400/[0.12] hover:text-violet-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  <span>Develop Idea</span>
                </button>
              </div>
            )}

            {/* 7. Dismiss Feedback drawer */}
            {isFeedbackOpen && (
              <RejectionDrawer
                ideaId={cand._id}
                onConfirm={onDismiss}
                onClose={() => setActiveFeedbackId(null)}
              />
            )}

            {/* 8. Obvious Affordance Recommendation Details Toggle Row */}
            <button
              onClick={() => setExpandedEvidenceId(isEvidenceExpanded ? null : cand._id)}
              className="w-full flex items-center justify-between p-3.5 mt-2 rounded-xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-200 cursor-pointer group text-left select-none outline-none focus-visible:border-violet-500/30"
            >
              <span className="text-[12px] font-medium tracking-wide text-white/50 group-hover:text-white/80 transition-colors">
                {isEvidenceExpanded ? 'Hide Recommendation Details' : 'View Recommendation Details'}
              </span>
              <ChevronDown 
                className={`h-4 w-4 text-white/30 group-hover:text-white/50 transition-transform duration-250 ease-in-out ${
                  isEvidenceExpanded ? 'rotate-180 text-violet-400' : ''
                }`}
              />
            </button>

            {/* 9. Progressive Disclosure evidence container (Animated height + opacity) */}
            <AnimatePresence initial={false}>
              {isEvidenceExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 p-4 rounded-xl border border-white/[0.03] bg-white/[0.005] flex flex-col gap-3.5 text-[12.5px] text-white/50 leading-relaxed">
                    {/* Supporting Evidence */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9.5px] font-medium tracking-[0.15em] uppercase text-white/45">Supporting Evidence</span>
                      <p className="text-[13px] leading-relaxed text-white/60">
                        {getFriendlyWhyNow(cand.whyNow)}
                      </p>
                    </div>

                    {/* Evaluator Analysis Details (Tightly formatted) */}
                    <EvaluatorDetails 
                      report={cand.evaluationReport} 
                      fallbackSignals={cand.sourceSignalSnapshots || []} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
