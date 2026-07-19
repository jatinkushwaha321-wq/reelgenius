'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * StrategicNarrative - Reverted to baseline visual design with scan-optimization.
 * Renders the Direction section panel matching NIVO's original UI, with expandable details.
 * 
 * @param {Object} props
 * @param {string} props.direction - The strategic direction text string
 */
export default function StrategicNarrative({ direction }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Split narrative into executive summary (first 2 sentences) and remainder
  const { summary, remainder } = useMemo(() => {
    if (!direction) return { summary: '', remainder: '' };
    
    // Regular expression to match sentences (ends in period/exclamation/question mark followed by space or end of string)
    const sentences = direction.match(/[^.!?]+[.!?]+(\s+|$)/g) || [direction];
    
    if (sentences.length <= 2) {
      return { summary: direction, remainder: '' };
    }
    
    const summaryText = sentences.slice(0, 2).join('').trim();
    const remainderText = sentences.slice(2).join('').trim();
    
    return { summary: summaryText, remainder: remainderText };
  }, [direction]);

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-px flex-1 max-w-[40px] bg-white/[0.06]" aria-hidden="true" />
        <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-white/20">
          Direction
        </span>
        <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-6 py-8 flex flex-col gap-6 min-h-[100px]">
        {direction ? (
          <>
            <div className="text-[15px] leading-relaxed text-white/75 font-sans">
              <p className="inline">
                {summary}
              </p>
              
              {remainder && (
                <>
                  {!isExpanded && <span className="text-white/30"> ...</span>}
                  
                  {isExpanded && (
                    <p className="mt-4 text-[14px] text-white/60 leading-relaxed border-t border-white/[0.02] pt-4 whitespace-pre-wrap">
                      {remainder}
                    </p>
                  )}
                  
                  <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="flex items-center gap-1 mt-3 text-[11px] font-medium tracking-nivo-wide uppercase text-violet-400 hover:text-violet-300 transition-colors cursor-pointer select-none"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Read More</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
            
            <div className="pt-4 border-t border-white/[0.02] flex justify-end">
              <Link
                href="/dashboard/ideas"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-medium tracking-[0.1em] uppercase rounded-lg border border-violet-400/25 bg-violet-400/[0.08] text-violet-300/80 hover:bg-violet-400/[0.15] hover:text-violet-200 transition-all"
              >
                Explore Ideas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[60px]">
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/15 select-none">
              DIRECTION NOT YET DERIVED
            </span>
            <span className="text-[11px] text-white/10 select-none">
              NIVO requires additional signal evidence to synthesize a strategic direction.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
