import React from 'react';

/**
 * SkeletonCard - Shared UI Primitive
 * Shimmering placeholder card to preserve layout geometry during loading states.
 * 
 * @param {Object} props
 * @param {string} [props.height='h-40'] - Card height
 * @param {number} [props.lines=3] - Number of placeholder text lines to render inside the card
 * @param {string} [props.className=''] - Additional classes
 */
export default function SkeletonCard({ height = 'h-40', lines = 3, className = '' }) {
  return (
    <div className={`w-full ${height} rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex flex-col justify-between animate-pulse ${className}`}>
      <div className="flex flex-col gap-2.5 w-full">
        {/* Title line placeholder */}
        <div className="h-4 bg-white/5 rounded w-1/3" />
        
        {/* Body line placeholders */}
        <div className="flex flex-col gap-2 mt-4">
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className="h-3 bg-white/[0.02] rounded" 
              style={{ width: i === lines - 1 ? '75%' : '100%' }}
            />
          ))}
        </div>
      </div>
      
      {/* Footer link placeholder */}
      <div className="h-3 bg-white/5 rounded w-1/4 self-end" />
    </div>
  );
}
