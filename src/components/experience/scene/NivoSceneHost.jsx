'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useExperience } from '@/lib/experience/use-experience';
import NivoScene from './NivoScene';

/**
 * Host component managing the React Three Fiber Canvas lifecycle.
 * Implements viewport IntersectionObserver and tab visibility listeners
 * to suspend rendering frame tick loops when inactive (consuming 0% CPU).
 */
export default function NivoSceneHost() {
  const { supportsWebGL } = useExperience();
  const hostRef = useRef(null);
  
  const [inViewport, setInViewport] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!supportsWebGL) return;
    
    setMounted(true);
    setTabVisible(document.visibilityState === 'visible');

    // 1. Tab visibility listener
    const onVisibilityChange = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // 2. Viewport intersection observer targeting the parent scroll boundary container
    let observer;
    const scrollBoundary = hostRef.current ? hostRef.current.parentElement : null;
    if (scrollBoundary) {
      observer = new IntersectionObserver(
        ([entry]) => {
          setInViewport(entry.isIntersecting);
        },
        { threshold: 0.01 } // Trigger when the scroll container moves off-screen
      );
      observer.observe(scrollBoundary);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (observer && scrollBoundary) {
        observer.unobserve(scrollBoundary);
        observer.disconnect();
      }
    };
  }, [supportsWebGL]);

  // Fail-safe WebGL fallback or unmounted check
  if (!supportsWebGL || !mounted) return null;

  // Active state: True only when tab is active AND viewport intersects the host element
  const isSceneActive = inViewport && tabVisible;

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 pointer-events-none z-[1] h-screen w-screen"
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45, near: 0.1, far: 1000 }}
        dpr={[1, 2]} // Capped device pixel ratio (safeguard target bounds)
        frameloop={isSceneActive ? 'always' : 'never'} // Dynamic GPU-preserving frameloop suspension
        style={{ pointerEvents: 'none' }}
      >
        <NivoScene />
      </Canvas>
    </div>
  );
}
