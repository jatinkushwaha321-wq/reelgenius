'use client';

import { useEffect, useRef, useState } from 'react';
import { useCursorStore } from '@/lib/stores/cursor-store';
import { useExperience } from '@/lib/experience/use-experience';

/**
 * Monochromatic custom contextual cursor component.
 * Tracks pointer position and renders contextual Space Mono overlays.
 * Toggles native pointer suppression on experience scopes and all their descendants.
 */
export default function NivoCursor() {
  const { allowCustomCursor } = useExperience();
  const getActiveCursor = useCursorStore((state) => state.getActiveCursor);
  const activeCursor = getActiveCursor();

  const [mounted, setMounted] = useState(false);
  const [insideScope, setInsideScope] = useState(false);
  const cursorRef = useRef(null);
  
  // High-frequency coordinates stored locally to prevent React rendering triggers
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (!allowCustomCursor) return;
    
    setMounted(true);

    const onPointerMove = (e) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
      
      // Determine if pointer is currently inside an experience scope boundary
      const scope = e.target.closest('.nivo-experience-scope');
      const hasScope = !!scope;
      setInsideScope(hasScope);

      // Toggle active cursor state class on the scope element to force descendant suppression
      if (scope) {
        document.querySelectorAll('.nivo-experience-scope').forEach((el) => {
          if (el !== scope) el.classList.remove('nivo-cursor-active');
        });
        scope.classList.add('nivo-cursor-active');
      } else {
        document.querySelectorAll('.nivo-experience-scope').forEach((el) => {
          el.classList.remove('nivo-cursor-active');
        });
      }
    };

    const onMouseLeaveDoc = () => {
      setInsideScope(false);
      document.querySelectorAll('.nivo-experience-scope').forEach((el) => {
        el.classList.remove('nivo-cursor-active');
      });
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveDoc);

    // Interpolation loop utilizing requestAnimationFrame
    const tick = () => {
      if (!cursorRef.current) {
        animationFrameId.current = requestAnimationFrame(tick);
        return;
      }
      
      // Smooth position interpolation (lerp factor: 0.15)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.15;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.15;

      cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    // Event delegation listeners checking relatedTarget boundaries to prevent descendant leaks
    const onMouseOver = (e) => {
      const target = e.target.closest('[data-cursor]');
      if (!target) return;

      const related = e.relatedTarget ? e.relatedTarget.closest('[data-cursor]') : null;
      // Skip if moving between descendants of the exact same cursor region
      if (related === target) return;

      const id = target.id || target.getAttribute('data-cursor-id') || 'delegated-region';
      const mode = target.getAttribute('data-cursor');
      const label = target.getAttribute('data-cursor-label') || '';
      
      useCursorStore.getState().pushCursor(id, mode, label);
    };

    const onMouseOut = (e) => {
      const target = e.target.closest('[data-cursor]');
      if (!target) return;

      const related = e.relatedTarget ? e.relatedTarget.closest('[data-cursor]') : null;
      // Skip if moving within the boundaries of the same cursor region
      if (related === target) return;

      const id = target.id || target.getAttribute('data-cursor-id') || 'delegated-region';
      useCursorStore.getState().popCursor(id);
    };

    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    // Inject CSS rule that cascades cursor: none to descendants of active experience scopes
    const style = document.createElement('style');
    style.id = 'nivo-cursor-suppression';
    style.innerHTML = `
      .nivo-experience-scope.nivo-cursor-active,
      .nivo-experience-scope.nivo-cursor-active * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onMouseLeaveDoc);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      const el = document.getElementById('nivo-cursor-suppression');
      if (el) el.remove();
      
      // Clean up any remaining classes from experience elements
      document.querySelectorAll('.nivo-experience-scope').forEach((el) => {
        el.classList.remove('nivo-cursor-active');
      });
    };
  }, [allowCustomCursor]);

  // Render nothing if custom cursor is disabled, not mounted, or outside experience scope
  if (!allowCustomCursor || !mounted || !insideScope) return null;

  const isDefault = activeCursor.mode === 'default';

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 will-change-transform mix-blend-difference hidden md:block"
    >
      <div className="flex items-center gap-3">
        {/* Monochromatic reticle */}
        <div
          className={`h-2.5 w-2.5 rounded-full bg-white transition-all duration-300 ease-out ${
            isDefault ? 'scale-100' : 'scale-150 bg-neutral-300'
          }`}
        />
        
        {/* Context label in Space Mono */}
        {!isDefault && activeCursor.label && (
          <span className="font-mono text-[10px] tracking-widest text-neutral-200 bg-neutral-900/90 px-2 py-0.5 rounded border border-white/10 uppercase select-none">
            {activeCursor.label}
          </span>
        )}
      </div>
    </div>
  );
}
