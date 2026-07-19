import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useScriptEditor - Shared UI Hook
 * Manages text editor buffer, tracks changes (dirty flag), handles debounced autosaves, and registers errors.
 * 
 * @param {Object} initialScript - Initial script state
 * @param {Function} onSave - Async callback when saving script changes
 * @param {number} [debounceMs=1000] - Debounce period in milliseconds
 * @returns {Object} Editor state and controller functions
 */
export default function useScriptEditor(initialScript, onSave, debounceMs = 1000) {
  const [editorBuffer, setEditorBuffer] = useState(initialScript || null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  
  const onSaveRef = useRef(onSave);
  const saveTimeoutRef = useRef(null);

  // Sync ref to prevent stale closures
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Sync editor buffer when initial script is loaded or re-fetched
  useEffect(() => {
    if (initialScript) {
      setEditorBuffer(initialScript);
      setIsDirty(false);
    }
  }, [initialScript]);

  const clearSaveTimeout = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Force synchronous save execution
  const triggerSave = useCallback(async (currentBuffer = editorBuffer) => {
    if (!currentBuffer || !isDirty) return;
    clearSaveTimeout();
    setIsSaving(true);
    setErrors([]);
    
    try {
      if (onSaveRef.current) {
        await onSaveRef.current(currentBuffer);
      }
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to autosave script:', err);
      setErrors(prev => [...prev, err.message || 'Autosave failed.']);
    } finally {
      setIsSaving(false);
    }
  }, [editorBuffer, isDirty, clearSaveTimeout]);

  // Schedule debounced autosave
  const scheduleSave = useCallback((updatedBuffer) => {
    clearSaveTimeout();
    setIsDirty(true);
    
    saveTimeoutRef.current = setTimeout(() => {
      triggerSave(updatedBuffer);
    }, debounceMs);
  }, [clearSaveTimeout, triggerSave, debounceMs]);

  // Handle updates to individual block text values
  const handleBlockChange = useCallback((blockId, updatedFields) => {
    if (!editorBuffer) return;

    setEditorBuffer(prev => {
      if (!prev) return null;
      
      let updatedBlocks = [];
      if (prev.blocks) {
        updatedBlocks = prev.blocks.map(block => 
          block._id === blockId || block.id === blockId 
            ? { ...block, ...updatedFields } 
            : block
        );
      }

      const updated = {
        ...prev,
        blocks: updatedBlocks
      };

      scheduleSave(updated);
      return updated;
    });
  }, [editorBuffer, scheduleSave]);

  // Save outstanding edits on unmount
  useEffect(() => {
    return () => {
      clearSaveTimeout();
    };
  }, [clearSaveTimeout]);

  return {
    editorBuffer,
    setEditorBuffer,
    isDirty,
    isSaving,
    errors,
    handleBlockChange,
    triggerSave,
    setErrors
  };
}
