import { create } from 'zustand';

/**
 * Ordered priority mappings for cursor states.
 * Higher values override lower values.
 */
export const PRIORITY_MAP = {
  default: 0,
  read: 10,
  scan: 20,
  move: 30,
  signal: 40
};

/**
 * Isolated Zustand store managing contextual cursor states.
 * Uses a registration stack with custom priority-based selection logic.
 */
export const useCursorStore = create((set, get) => ({
  // Stack of active hover states: { id: String, mode: String, label: String }
  cursorStack: [],

  /**
   * Pushes a cursor configuration onto the stack.
   * Prevents duplicate registrations for the same context ID.
   * 
   * @param {string} id - Unique identifier for the hover context (e.g., element ID).
   * @param {string} mode - Semantic cursor mode ('read', 'scan', 'move', 'signal', 'default').
   * @param {string} [label] - Muted Space Mono uppercase text overlay.
   */
  pushCursor: (id, mode, label = '') => set((state) => {
    const cleanStack = state.cursorStack.filter((item) => item.id !== id);
    return {
      cursorStack: [...cleanStack, { id, mode, label }]
    };
  }),

  /**
   * Removes a cursor configuration from the stack.
   * 
   * @param {string} id - The context identifier to remove.
   */
  popCursor: (id) => set((state) => ({
    cursorStack: state.cursorStack.filter((item) => item.id !== id)
  })),

  /**
   * Clears the entire stack, reverting back to default state.
   */
  clearCursor: () => set({ cursorStack: [] }),

  /**
   * Resolves the active cursor context based on semantic priority.
   * 
   * Priority Rules:
   * 1. The registered item with the highest semantic priority in PRIORITY_MAP wins.
   * 2. If priorities are equal, the most recently pushed context wins (tie-breaker).
   * 
   * @returns {Object} Active configuration: { mode: string, label: string }
   */
  getActiveCursor: () => {
    const stack = get().cursorStack;
    if (stack.length === 0) {
      return { mode: 'default', label: '' };
    }
    
    let active = stack[0];
    let maxPriority = PRIORITY_MAP[active.mode] || 0;
    
    for (let i = 1; i < stack.length; i++) {
      const item = stack[i];
      const pri = PRIORITY_MAP[item.mode] || 0;
      
      // Select higher priority. Tie-breaker: recency wins (larger index in stack)
      if (pri > maxPriority) {
        active = item;
        maxPriority = pri;
      } else if (pri === maxPriority) {
        active = item;
      }
    }
    
    return active;
  }
}));
