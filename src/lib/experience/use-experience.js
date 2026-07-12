import { useState, useEffect } from 'react';
import { getRenderCapability } from './render-mode';
import { getVisitorStateSafe, setVisitorStateSafe } from './visitor-state';

/**
 * Hydration-safe React hook exposing visual capabilities and visitor history.
 * Ensures initial server matches client rendering values. Exposes listeners 
 * for resizing and system preferences.
 * 
 * @returns {Object} Hydration-safe experience capability properties.
 */
export function useExperience() {
  const [capability, setCapability] = useState({
    renderMode: 'mobile',
    prefersReducedMotion: false,
    isCoarsePointer: true,
    supportsWebGL: false,
    allowSpatialInteraction: false,
    allowCustomCursor: false,
    maxElements: 30,
    visitorState: 'first-contact',
    isHydrated: false
  });

  useEffect(() => {
    function handleUpdate() {
      const cap = getRenderCapability();
      const visitor = getVisitorStateSafe();
      setCapability({
        ...cap,
        visitorState: visitor,
        isHydrated: true
      });
    }

    // Initialize capabilities on mount (hydration completion)
    handleUpdate();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: coarse)');

    // Throttled resize coordinator to prevent continuous layout reflows
    let resizeTimeout;
    const onResize = () => {
      handleUpdate();
    };
    
    const throttledResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(onResize, 150);
    };

    window.addEventListener('resize', throttledResize, { passive: true });
    
    const handleMediaQueryChange = () => handleUpdate();
    
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMediaQueryChange);
      pointerQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      motionQuery.addListener(handleMediaQueryChange);
      pointerQuery.addListener(handleMediaQueryChange);
    }

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('resize', throttledResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleMediaQueryChange);
        pointerQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        motionQuery.removeListener(handleMediaQueryChange);
        pointerQuery.removeListener(handleMediaQueryChange);
      }
    };
  }, []);

  const markVisitorAsVisited = () => {
    if (typeof window !== 'undefined') {
      setVisitorStateSafe('repeat-visitor');
      setCapability(prev => ({
        ...prev,
        visitorState: 'repeat-visitor'
      }));
    }
  };

  const resetVisitorState = () => {
    if (typeof window !== 'undefined') {
      setVisitorStateSafe('first-contact');
      setCapability(prev => ({
        ...prev,
        visitorState: 'first-contact'
      }));
    }
  };

  return {
    ...capability,
    markVisitorAsVisited,
    resetVisitorState
  };
}
