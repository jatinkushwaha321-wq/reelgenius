import React from 'react';

/**
 * ConfidenceMeter - Core UI Primitive
 * Visual representation of Evaluator alignment metrics and verdict grading.
 * 
 * @param {Object} props
 * @param {number} props.score - Performance score (0-100)
 * @param {'APPROVE' | 'REJECT' | 'CAUTION'} props.verdict - Evaluator verdict
 * @param {string} [props.className=''] - Additional classes
 */
export default function ConfidenceMeter({ score, verdict, className = '' }) {
  const verdictStyles = {
    APPROVE: 'text-nivo-success bg-nivo-success-muted border-nivo-success-border',
    REJECT: 'text-red-400 bg-nivo-error-muted border-nivo-error-border',
    CAUTION: 'text-nivo-warning bg-nivo-warning-muted border-nivo-warning-border',
  };

  const styleClass = verdictStyles[verdict] || verdictStyles.APPROVE;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono font-medium border rounded-md ${styleClass} ${className}`}>
      <span className="tracking-wider uppercase">{verdict}</span>
      <span className="h-2.5 w-px bg-current/25" />
      <span className="font-semibold">{score}% Alignment</span>
    </div>
  );
}
