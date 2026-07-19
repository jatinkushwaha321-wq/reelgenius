import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useCooldownTimer - Core Shared Hook
 * Coordinates a 60-second cooldown timer backed by localStorage to persist across route transitions and browser refreshes.
 * 
 * @param {string} [storageKey='nivo-cooldown-target'] - The localStorage key to store the target time
 * @param {number} [durationMs=60000] - Cooldown duration in milliseconds
 * @returns {Object} { cooldownSeconds, isCooldownActive, triggerCooldown }
 */
export default function useCooldownTimer(storageKey = 'nivo-cooldown-target', durationMs = 60000) {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((targetTime) => {
    clearTimer();

    const checkTime = () => {
      const remainingMs = targetTime - Date.now();
      if (remainingMs > 0) {
        setCooldownSeconds(Math.ceil(remainingMs / 1000));
      } else {
        setCooldownSeconds(0);
        clearTimer();
        try {
          localStorage.removeItem(storageKey);
        } catch (e) {
          console.warn('Failed to clear cooldown in localStorage', e);
        }
      }
    };

    checkTime();
    intervalRef.current = setInterval(checkTime, 1000);
  }, [clearTimer, storageKey]);

  // Synchronize with stored cooldown on mount
  useEffect(() => {
    try {
      const storedTarget = localStorage.getItem(storageKey);
      if (storedTarget) {
        const targetTime = parseInt(storedTarget, 10);
        if (targetTime > Date.now()) {
          startCountdown(targetTime);
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (e) {
      console.warn('Failed to read cooldown target from localStorage', e);
    }

    return () => clearTimer();
  }, [startCountdown, clearTimer, storageKey]);

  // Manually trigger a new cooldown cycle
  const triggerCooldown = useCallback(() => {
    const targetTime = Date.now() + durationMs;
    try {
      localStorage.setItem(storageKey, targetTime.toString());
    } catch (e) {
      console.warn('Failed to store cooldown target in localStorage', e);
    }
    startCountdown(targetTime);
  }, [startCountdown, durationMs, storageKey]);

  return {
    cooldownSeconds,
    isCooldownActive: cooldownSeconds > 0,
    triggerCooldown,
  };
}
