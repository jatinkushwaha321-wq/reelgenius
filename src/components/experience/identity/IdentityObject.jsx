'use client';

import { useMemo } from 'react';
import { useExperience } from '@/lib/experience/use-experience';
import { VisualStateAdapter } from '@/lib/experience/visual-state-adapter';
import { generateLayerGeometry } from '@/lib/experience/field-geometry';
import IdentityFieldLayer from './IdentityFieldLayer';

/**
 * Composition boundary coordinating the NIVO spatial identity field.
 *
 * Coordinate-space invariant:
 *   - generateLayerGeometry() produces field-local positions around [0, 0, 0].
 *   - field.origin is applied ONCE via this component's parent <group> position.
 *   - No downstream component adds field.origin into vertex positions.
 */
export default function IdentityObject({ mode = 'uninitialized' }) {
  const { maxElements, prefersReducedMotion } = useExperience();

  // Derive normalized visual state through the adapter (memoized on stable inputs)
  const visualState = useMemo(
    () => VisualStateAdapter.getVisualState({ mode, budget: { maxElements } }),
    [mode, maxElements]
  );

  const { field } = visualState;

  // Generate geometry for all layers once — deterministic, stable, field-local
  const layerGeometries = useMemo(
    () =>
      field.layers.map((layer) =>
        generateLayerGeometry(layer, field.extent, field.stretch, `nivo-${mode}`)
      ),
    [field, mode]
  );

  return (
    <group position={field.origin}>
      {field.layers.map((layer, idx) => (
        <IdentityFieldLayer
          key={layer.id}
          geometryData={layerGeometries[idx]}
          layerConfig={layer}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </group>
  );
}
