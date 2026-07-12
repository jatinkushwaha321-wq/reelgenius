'use client';

/**
 * Technical Three.js scene graph component.
 * Manages lighting, perspective cameras, and base environments.
 * Encapsulated inside the R3F Canvas context.
 * 
 * Empty by default in M5.5 (no diagnostic mesh geometry is present).
 */
import IdentityObject from '../identity/IdentityObject';

export default function NivoScene() {
  return (
    <>
      {/* Minimal scene fill — identity field uses ShaderMaterial, bypasses lighting */}
      <ambientLight intensity={0.15} />

      {/* Identity Object primitive composition */}
      <IdentityObject mode="uninitialized" />
    </>
  );
}
