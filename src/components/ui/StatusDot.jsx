import React from 'react';

/**
 * StatusDot - Core UI Primitive
 * Stateless component representing processing, observation, or error states.
 * 
 * @param {Object} props
 * @param {'violet' | 'red' | 'green' | 'amber'} [props.color='violet'] - Semantic dot color
 * @param {boolean} [props.pulse=false] - Whether to apply pulsing animation
 * @param {string} [props.className=''] - Additional class names
 */
export default function StatusDot({ color = 'violet', pulse = false, className = '' }) {
  const colorMap = {
    violet: 'bg-violet-400/40',
    red: 'bg-red-400/60',
    green: 'bg-nivo-success',
    amber: 'bg-nivo-warning',
  };

  const bgClass = colorMap[color] || colorMap.violet;

  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${bgClass} ${pulse ? 'animate-pulse' : ''} mr-2.5 align-middle ${className}`}
      aria-hidden="true"
    />
  );
}
