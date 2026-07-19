import React from 'react';
import ConfidenceMeter from '@/components/ui/ConfidenceMeter';
import EvidenceCitation from '@/components/ui/EvidenceCitation';

/**
 * EvaluatorDetails - Presentation UI Component
 * Explains the alignment score and details supporting indicators (citations and strengths) with zero technical terminology.
 * 
 * @param {Object} props
 * @param {Object} props.report - The evaluationReport payload (from backend)
 * @param {Array} [props.fallbackSignals=[]] - Fallback signals to compute scores from if report is missing
 */
export default function EvaluatorDetails({ report, fallbackSignals = [] }) {
  const score = report?.overallVerdict?.score ?? null;
  const verdict = report?.overallVerdict?.recommendation ?? 'APPROVE';
  const strengths = report?.strengths || [];
  const citations = report?.appliedKnowledgeItems || [];

  const hasReport = !!report;
  const displayScore = hasReport 
    ? score 
    : fallbackSignals.length > 0 
      ? Math.round(fallbackSignals.reduce((acc, sig) => acc + (sig.confidence || 75), 0) / fallbackSignals.length) 
      : 80;

  const showStrengths = strengths.length > 0;
  const showCitations = citations.length > 0 || (!hasReport && fallbackSignals.length > 0);

  // Creator-facing explanation instead of just raw numbers
  const getVerdictExplanation = () => {
    if (report?.overallVerdict?.reasoning) {
      return report.overallVerdict.reasoning;
    }
    if (strengths && strengths.length > 0) {
      return strengths[0];
    }
    // Content-driven natural mappings
    if (displayScore >= 88) {
      return 'Strong match with your audience interests and current signals.';
    } else if (displayScore >= 75) {
      return 'Supported by successful past posts and content pillars.';
    } else {
      return 'Aligns with your niche benchmark standards.';
    }
  };

  // Maps signal trends to professional creator-facing insights
  const getFriendlySignalLabel = (sig) => {
    const trend = sig.trend || 'stable';
    if (trend === 'rising') {
      if (sig.strength >= 75) return 'High engagement signal';
      return 'Reel-first content';
    } else if (trend === 'stable') {
      return 'Proven audience pattern';
    } else {
      return 'Strong historical performance';
    }
  };

  const getFriendlyCitationLabel = (c) => {
    if (c.statement) return c.statement;
    return 'Validated principle';
  };

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.02] text-[12.5px]">
      {/* Alignment Header & Metric Badge */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-[9px] font-medium tracking-[0.12em] uppercase text-white/35">NIVO Alignment</span>
        <ConfidenceMeter score={displayScore} verdict={verdict} className="scale-95 origin-right shrink-0" />
      </div>

      {/* Narrative Score Justification */}
      <div className="text-[13px] text-white/80 leading-relaxed font-medium bg-white/[0.01] px-3 py-2 rounded-lg border border-white/[0.02]">
        {getVerdictExplanation()}
      </div>

      {/* Supporting strengths list */}
      {showStrengths && (
        <div className="flex flex-col gap-1.5 mt-0.5">
          <span className="text-[9.5px] font-medium tracking-[0.1em] uppercase text-white/40">Verified Indicators</span>
          <ul className="flex flex-col gap-1 pl-1">
            {strengths.slice(0, 2).map((st, idx) => (
              <li key={idx} className="text-[12px] text-white/50 flex items-start gap-2">
                <span className="text-violet-400 shrink-0 select-none">✓</span>
                <span className="leading-snug">{st}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Creator-facing citations map (No technical SIG-xxx references) */}
      {showCitations && (
        <div className="flex flex-col gap-1.5 mt-0.5">
          <span className="text-[9.5px] font-medium tracking-[0.1em] uppercase text-white/40">Evidence Anchors</span>
          <div className="flex flex-wrap gap-1.5">
            {hasReport ? (
              citations.map((c, idx) => (
                <EvidenceCitation 
                  key={idx} 
                  citationCode={c.citationCode ? `Principle ${c.citationCode}` : 'Validated Principle'}
                  label={getFriendlyCitationLabel(c)}
                  strength={c.strength}
                />
              ))
            ) : (
              fallbackSignals.slice(0, 2).map((sig, idx) => (
                <EvidenceCitation 
                  key={idx} 
                  citationCode={getFriendlySignalLabel(sig)}
                  label={sig.displayName}
                  strength={sig.strength}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
