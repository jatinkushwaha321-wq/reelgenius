/**
 * Predefined diagnostic visual narrative states for the NIVO Identity Field.
 * Uses the field.layers[] contract schema.
 * Exposes renderer-domain visual parameters only. Decoupled from creator Signal metrics.
 */
export const NARRATIVE_STATES = {
  // Default uninitialized state — scattered traces, partial fragments, emerging coherence
  uninitialized: {
    mode: 'uninitialized',
    field: {
      origin: [2.5, -0.3, 0.0],      // World-space center (biased right of viewport center)
      extent: 10.0,                    // Maximum generation radius (world units)
      stretch: [1.6, 1.0, 0.7],       // Ellipsoidal asymmetry: horizontally elongated, depth-compressed
      coherence: 0.35,                 // Global coherence level (0 = scattered, 1 = fully formed)

      layers: [
        {
          id: 'outer-traces',
          curveCount: 40,
          radiusRange: [5.5, 9.0],
          opacity: 0.08,
          fragmentLength: 0.35,
          stability: 0.3,
          driftSpeed: 0.008,
          color: '#a1a1aa'
        },
        {
          id: 'structural-fragments',
          curveCount: 24,
          radiusRange: [2.5, 5.0],
          opacity: 0.18,
          fragmentLength: 0.55,
          stability: 0.6,
          driftSpeed: 0.012,
          color: '#d4d4d8'
        },
        {
          id: 'coherence-region',
          curveCount: 16,
          radiusRange: [0.0, 2.5],
          opacity: 0.32,
          fragmentLength: 0.85,
          stability: 0.85,
          driftSpeed: 0.005,
          color: '#e4e4e7'
        }
      ]
    },
    camera: {
      targetPosition: [0, 0, 10],
      targetLookAt: [0, 0, 0],
      fov: 45
    }
  },

  // Narrative scroll layout — more coherent, wider field, stronger fragments
  narrative: {
    mode: 'narrative',
    field: {
      origin: [1.5, 0.0, 0.0],
      extent: 12.0,
      stretch: [1.8, 1.0, 0.7],
      coherence: 0.7,

      layers: [
        {
          id: 'outer-traces',
          curveCount: 35,
          radiusRange: [6.0, 11.0],
          opacity: 0.05,
          fragmentLength: 0.5,
          stability: 0.4,
          driftSpeed: 0.01,
          color: '#71717a'
        },
        {
          id: 'structural-fragments',
          curveCount: 28,
          radiusRange: [3.0, 6.0],
          opacity: 0.22,
          fragmentLength: 0.7,
          stability: 0.65,
          driftSpeed: 0.015,
          color: '#d4d4d8'
        },
        {
          id: 'coherence-region',
          curveCount: 20,
          radiusRange: [0.0, 3.0],
          opacity: 0.38,
          fragmentLength: 0.92,
          stability: 0.9,
          driftSpeed: 0.004,
          color: '#fafafa'
        }
      ]
    },
    camera: {
      targetPosition: [0, 0, 8],
      targetLookAt: [0, 0, 0],
      fov: 45
    }
  }
};
