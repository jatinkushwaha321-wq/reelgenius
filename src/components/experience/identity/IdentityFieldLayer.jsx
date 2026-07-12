'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Shaders — per-vertex aProgress + uReveal for continuous fragment-level reveal.
// GPU-driven drift via uTime + uDriftAmount eliminates ALL per-frame CPU buffer mutations.
// ---------------------------------------------------------------------------

const VERTEX_SHADER = `
  attribute float aProgress;
  uniform float uTime;
  uniform float uDriftAmount;
  uniform float uDriftSpeed;
  varying float vProgress;

  void main() {
    vProgress = aProgress;

    // Structural breathing: position-seeded displacement, GPU-only
    float seed = position.x * 1.7 + position.y * 2.3 + position.z * 3.1;
    float timeScale = uTime * uDriftSpeed * 50.0;
    vec3 displaced = position;
    displaced.x += sin(timeScale + seed) * uDriftAmount;
    displaced.y += cos(timeScale * 0.8 + seed * 1.3) * uDriftAmount;
    displaced.z += sin(timeScale * 1.2 + seed * 0.7) * uDriftAmount * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uReveal;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vProgress;

  void main() {
    if (vProgress > uReveal) discard;
    float edge = smoothstep(uReveal, uReveal - 0.05, vProgress);
    gl_FragColor = vec4(uColor, edge * uOpacity);
  }
`;

/**
 * Renders one identity field layer as a single THREE.LineSegments draw call.
 *
 * Geometry is pre-computed (merged indexed BufferGeometry from field-geometry.js)
 * and uploaded once on mount. Per-frame work is limited to one uniform update (uTime).
 *
 * Props:
 *   geometryData     — { positions, progress, indices } from generateLayerGeometry()
 *   layerConfig      — layer definition from the visual-state contract
 *   prefersReducedMotion — from useExperience()
 */
export default function IdentityFieldLayer({ geometryData, layerConfig, prefersReducedMotion }) {
  const geometryRef = useRef(null);
  const materialRef = useRef(null);
  const { invalidate } = useThree();

  // Create uniforms object once — values updated imperatively via materialRef
  const uniforms = useMemo(() => ({
    uReveal: { value: layerConfig.fragmentLength },
    uOpacity: { value: layerConfig.opacity },
    uColor: { value: new THREE.Color(layerConfig.color) },
    uTime: { value: 0 },
    uDriftAmount: { value: prefersReducedMotion ? 0 : (1 - layerConfig.stability) * 0.08 },
    uDriftSpeed: { value: layerConfig.driftSpeed }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // Set up indexed BufferGeometry from pre-computed geometry data
  useEffect(() => {
    const geo = geometryRef.current;
    if (!geo || geometryData.vertexCount === 0) return;

    geo.setAttribute('position', new THREE.BufferAttribute(geometryData.positions, 3));
    geo.setAttribute('aProgress', new THREE.BufferAttribute(geometryData.progress, 1));
    geo.setIndex(new THREE.BufferAttribute(geometryData.indices, 1));
    geo.computeBoundingSphere();

    invalidate();
  }, [geometryData, invalidate]);

  // Sync uniforms when layerConfig or motion preference changes
  useEffect(() => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uReveal.value = layerConfig.fragmentLength;
    u.uOpacity.value = layerConfig.opacity;
    u.uColor.value.set(layerConfig.color);
    u.uDriftAmount.value = prefersReducedMotion ? 0 : (1 - layerConfig.stability) * 0.08;
    u.uDriftSpeed.value = layerConfig.driftSpeed;
  }, [layerConfig, prefersReducedMotion]);

  // Frame loop — only updates the time uniform (zero CPU geometry work)
  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  // Skip rendering if no geometry data
  if (geometryData.vertexCount === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}
