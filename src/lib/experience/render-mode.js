/**
 * Safely checks WebGL capability in the browser.
 * 
 * @returns {boolean} True if WebGL is supported by the browser context.
 */
export function detectWebGL() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Derives visual capability metrics based on active browser properties.
 * Maps viewport sizes and hardware pointer devices directly to rendering profiles.
 * 
 * Render Modes:
 * - 'desktop': Viewport width >= 1024px. Standard interaction enabled.
 * - 'tablet': Viewport width >= 768px and < 1024px. Coarse pointer checks.
 * - 'mobile': Viewport width < 768px. Lightweight node limits, pointer interaction disabled.
 * 
 * @returns {Object} The complete derived capability contract.
 */
export function getRenderCapability() {
  // Default values for Server-Side Rendering (SSR) fallback
  if (typeof window === 'undefined') {
    return {
      renderMode: 'mobile',
      prefersReducedMotion: false,
      isCoarsePointer: true,
      supportsWebGL: false,
      allowSpatialInteraction: false,
      allowCustomCursor: false,
      maxElements: 30
    };
  }

  // 1. Direct Browser Capabilities
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const supportsWebGL = detectWebGL();
  
  const width = window.innerWidth;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  // 2. Derived Policy Decisions
  let renderMode = 'desktop';
  if (isMobile) {
    renderMode = 'mobile';
  } else if (isTablet) {
    renderMode = 'tablet';
  }
  
  // Custom cursor is fine-pointer only and restricted to desktop sizes
  const allowCustomCursor = !isCoarsePointer && renderMode === 'desktop';
  
  // Spatial 3D hover/interactions are disabled on mobile viewports or when WebGL is blocked
  const allowSpatialInteraction = supportsWebGL && (renderMode === 'desktop' || renderMode === 'tablet');
  
  // Limit thresholds to maintain high framerates
  let maxElements = 80;
  
  if (renderMode === 'tablet') {
    maxElements = 50;
  } else if (renderMode === 'mobile') {
    maxElements = 30;
  }
  
  return {
    renderMode,
    prefersReducedMotion,
    isCoarsePointer,
    supportsWebGL,
    allowSpatialInteraction,
    allowCustomCursor,
    maxElements
  };
}
