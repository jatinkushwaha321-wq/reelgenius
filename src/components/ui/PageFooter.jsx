import React from 'react';

/**
 * PageFooter - Core UI Primitive
 * Standardized footer containing the version and current workspace route context.
 * 
 * @param {Object} props
 * @param {string} [props.segment='Overview'] - The current view name (e.g. 'Overview', 'Ideas', 'Profile')
 * @param {string} [props.className=''] - Additional classes
 */
export default function PageFooter({ segment = 'Overview', className = '' }) {
  return (
    <footer className={`pt-4 border-t border-white/[0.03] mt-10 ${className}`}>
      <div className="flex items-center gap-4 text-[9px] tracking-nivo-wide uppercase text-white/15 select-none">
        <span>NIVO v1</span>
        <span className="h-px w-3 bg-white/[0.06]" aria-hidden="true" />
        <span>{segment}</span>
      </div>
    </footer>
  );
}
