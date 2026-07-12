import { NARRATIVE_STATES } from './narrative-states.js';

/**
 * Visual State Adapter.
 * Bridges raw application data / narrative parameters to the normalized
 * field.layers[] renderer contract.
 *
 * IdentityObject remains 100% unaware of Signal models or databases.
 */
export class VisualStateAdapter {
  /**
   * Adapts the active experience parameters into a normalized visual-state config.
   *
   * @param {Object} params - The inputs (e.g. current mode, device budget).
   * @returns {Object} Normalized visual contract consumed by IdentityObject.jsx.
   */
  static getVisualState(params = {}) {
    const { mode = 'uninitialized', budget = {} } = params;

    // Retrieve base config for the requested mode
    const baseConfig = NARRATIVE_STATES[mode] || NARRATIVE_STATES.uninitialized;
    const maxElements = budget.maxElements || 80;

    // Calculate total curve count across all layers
    const totalCurves = baseConfig.field.layers.reduce((sum, l) => sum + l.curveCount, 0);

    let adjustedLayers;

    if (totalCurves > maxElements) {
      // Step 1: Proportional floor counts
      const scaledCounts = baseConfig.field.layers.map((l) =>
        Math.floor((l.curveCount / totalCurves) * maxElements)
      );

      // Step 2: Distribute remainder to satisfy exact budget target
      let allocatedSum = scaledCounts.reduce((sum, v) => sum + v, 0);
      let remainder = maxElements - allocatedSum;
      let idx = 0;
      while (remainder > 0) {
        scaledCounts[idx % scaledCounts.length]++;
        remainder--;
        idx++;
      }

      adjustedLayers = baseConfig.field.layers.map((l, i) => ({
        ...l,
        curveCount: scaledCounts[i]
      }));
    } else {
      adjustedLayers = baseConfig.field.layers.map((l) => ({ ...l }));
    }

    return {
      ...baseConfig,
      field: {
        ...baseConfig.field,
        layers: adjustedLayers
      }
    };
  }

  /**
   * Future Milestone 6 adapter placeholder.
   * Will map raw database Signal documents to field layer definitions.
   * Decouples Three.js from Mongoose schema shapes.
   *
   * @param {Array<Object>} mongooseSignals - Raw MongoDB Signal documents.
   * @returns {Array<Object>} Normalized layer models.
   */
  static mapSignalsToFieldLayers(mongooseSignals) {
    return mongooseSignals.map((sig) => ({
      id: sig.key,
      curveCount: 12,
      radiusRange: [1.0, 4.0],
      opacity: (sig.strength || 50) / 200,
      fragmentLength: (sig.confidence || 50) / 100,
      stability: (sig.confidence || 50) / 100,
      driftSpeed: sig.trend === 'rising' ? 0.02 : 0.01,
      color: '#e4e4e7'
    }));
  }
}
