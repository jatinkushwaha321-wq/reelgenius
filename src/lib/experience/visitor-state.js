export const VISITOR_KEY = 'nivo_experience_v1';

/**
 * Reads visitor experience state defensively from localStorage.
 * Handles storage unavailability, security blocks, and Server Side Rendering (SSR).
 * Falls back safely to 'first-contact' on any storage error.
 * 
 * @returns {'first-contact' | 'repeat-visitor'} The experience state.
 */
export function getVisitorStateSafe() {
  if (typeof window === 'undefined') return 'first-contact';
  try {
    const val = localStorage.getItem(VISITOR_KEY);
    if (val === 'repeat-visitor') {
      return 'repeat-visitor';
    }
    return 'first-contact';
  } catch (e) {
    // Fail silently to prevent crashing under strict browser/iframe privacy settings
    return 'first-contact';
  }
}

/**
 * Persists visitor experience state defensively to localStorage.
 * 
 * @param {'first-contact' | 'repeat-visitor'} state - The state to persist.
 */
export function setVisitorStateSafe(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITOR_KEY, state);
  } catch (e) {
    // Fail silently in case storage is restricted
  }
}
