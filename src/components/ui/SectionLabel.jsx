import React from 'react';

/**
 * SectionLabel - Typographic UI Primitive
 * Standardized metadata label for headers and section headers.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Label content
 * @param {string} [props.className=''] - Additional classes
 */
export default function SectionLabel({ children, className = '' }) {
  return (
    <span className={`text-[10px] font-medium tracking-nivo-widest uppercase text-white/30 align-middle ${className}`}>
      {children}
    </span>
  );
}
