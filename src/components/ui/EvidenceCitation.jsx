import React from 'react';

/**
 * EvidenceCitation - Core UI Primitive
 * Inline pill anchoring strategic opportunity to a knowledge base item or observed evidence.
 * 
 * @param {Object} props
 * @param {string} props.citationCode - Code identifier (e.g. 'KB-104')
 * @param {string} [props.label] - Description label or statement snippet
 * @param {number} [props.strength] - Optional strength score (0-100)
 * @param {string} [props.className=''] - Additional classes
 */
export default function EvidenceCitation({ citationCode, label, strength, className = '' }) {
  return (
    <span 
      className={`inline-flex items-center gap-1.5 text-[9px] font-mono border border-violet-400/15 bg-violet-400/[0.03] text-violet-300/80 px-2 py-0.5 rounded select-none ${className}`}
      title={label ? `${citationCode}: ${label}` : citationCode}
    >
      <span>{citationCode}</span>
      {strength != null && (
        <>
          <span className="h-2 w-px bg-violet-400/20" />
          <span className="text-violet-400/60 font-semibold">{strength}%</span>
        </>
      )}
    </span>
  );
}
