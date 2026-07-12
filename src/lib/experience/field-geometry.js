import { CatmullRomCurve3, Vector3, Quaternion } from 'three';

/**
 * Seeded pseudo-random number generator.
 * Returns a function producing deterministic values in [0, 1).
 */
export function createSeededRandom(seedString) {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }
  let h = seed ^ 0xdeadbeef;
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Generates merged indexed LineSegments geometry for one field layer.
 *
 * All positions are in field-local coordinates around [0, 0, 0].
 * field.origin is NOT applied here — it is applied once by the parent R3F <group>.
 *
 * Each curve is a CatmullRomCurve3 arc on a randomly oriented ellipsoidal shell.
 * The output is formatted for THREE.LineSegments with an index buffer:
 *   - No spurious connections between curves
 *   - Interior vertices stored once, referenced twice by the index buffer
 *
 * @param {Object} layerConfig   - Layer definition from the visual-state contract
 * @param {number} fieldExtent   - Maximum generation radius (world units)
 * @param {number[]} fieldStretch - [x, y, z] axis scale for ellipsoidal asymmetry
 * @param {string} seed          - Deterministic seed string
 * @returns {{ positions: Float32Array, progress: Float32Array, indices: Uint16Array, vertexCount: number, indexCount: number }}
 */
export function generateLayerGeometry(layerConfig, fieldExtent, fieldStretch, seed) {
  const { curveCount, radiusRange } = layerConfig;
  const [rMin, rMax] = radiusRange;
  const [sx, sy, sz] = fieldStretch;

  if (curveCount === 0) {
    return {
      positions: new Float32Array(0),
      progress: new Float32Array(0),
      indices: new Uint16Array(0),
      vertexCount: 0,
      indexCount: 0
    };
  }

  const rand = createSeededRandom(`${seed}-${layerConfig.id}`);

  // Derive samples per curve from normalized radial position.
  // Inner curves (small radius) get more samples for smoothness.
  // Outer curves (large radius) get fewer — they are faint and short.
  const avgRadius = (rMin + rMax) / 2;
  const normalizedRadius = fieldExtent > 0 ? avgRadius / fieldExtent : 0;
  const samplesPerCurve = Math.max(20, Math.round(40 - 16 * normalizedRadius));

  // Pre-calculate total buffer sizes
  const totalVertices = curveCount * samplesPerCurve;
  const totalIndices = curveCount * 2 * (samplesPerCurve - 1);

  const positions = new Float32Array(totalVertices * 3);
  const progress = new Float32Array(totalVertices);
  const indices = new Uint16Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  for (let c = 0; c < curveCount; c++) {
    // --- 1. Random arc orientation via uniform random quaternion (Marsaglia/Shoemake) ---
    const u1 = rand();
    const u2 = rand();
    const u3 = rand();
    const quat = new Quaternion(
      Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2),
      Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2),
      Math.sqrt(u1) * Math.sin(2 * Math.PI * u3),
      Math.sqrt(u1) * Math.cos(2 * Math.PI * u3)
    );

    // --- 2. Arc parameters ---
    const baseRadius = rMin + rand() * (rMax - rMin);
    const arcSpan = 0.8 + rand() * 2.0; // 0.8–2.8 radians (≈45°–160°)
    const numControlPoints = 4 + Math.floor(rand() * 2); // 4 or 5

    // --- 3. Generate control points along an arc in the XZ plane, then rotate ---
    const controlPoints = [];
    for (let p = 0; p < numControlPoints; p++) {
      const t = p / (numControlPoints - 1);
      const angle = t * arcSpan;
      const r = baseRadius * (0.9 + rand() * 0.2); // ±10% radius jitter
      const yNoise = (rand() - 0.5) * 0.3 * baseRadius; // slight perpendicular variation

      const pt = new Vector3(
        r * Math.cos(angle),
        yNoise,
        r * Math.sin(angle)
      );

      // Rotate to random orientation
      pt.applyQuaternion(quat);

      // Apply ellipsoidal stretch
      pt.x *= sx;
      pt.y *= sy;
      pt.z *= sz;

      controlPoints.push(pt);
    }

    // --- 4. Create smooth curve and sample ---
    const curve = new CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5);
    const samplePoints = curve.getPoints(samplesPerCurve - 1); // returns samplesPerCurve points

    // --- 5. Write vertices and per-vertex progress attribute ---
    const baseVertex = vertexOffset;
    for (let s = 0; s < samplesPerCurve; s++) {
      const pt = samplePoints[s];
      positions[(vertexOffset + s) * 3] = pt.x;
      positions[(vertexOffset + s) * 3 + 1] = pt.y;
      positions[(vertexOffset + s) * 3 + 2] = pt.z;
      progress[vertexOffset + s] = s / (samplesPerCurve - 1);
    }

    // --- 6. Write index pairs for LineSegments (no spurious inter-curve connection) ---
    for (let s = 0; s < samplesPerCurve - 1; s++) {
      indices[indexOffset] = baseVertex + s;
      indices[indexOffset + 1] = baseVertex + s + 1;
      indexOffset += 2;
    }

    vertexOffset += samplesPerCurve;
  }

  return {
    positions,
    progress,
    indices,
    vertexCount: totalVertices,
    indexCount: totalIndices
  };
}
