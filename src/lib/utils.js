import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names resolving style conflicts.
 *
 * @param  {...any} inputs - Class values to join
 * @returns {string} Merged class list
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a human-readable relative time string.
 *
 * @param {Date|string} date - The date to format
 * @returns {string} Relative time string (e.g., '2 hours ago')
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Truncates a string with an ellipsis.
 *
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum character count
 * @returns {string}
 */
export function truncate(str, maxLength = 100) {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Normalizes internal AI/engineering terminology into creator-facing language,
 * and falls back to a friendly message if clean-up is not possible.
 *
 * @param {string} text - Raw AI explanation string
 * @returns {string} Cleaned, creator-friendly explanation
 */
export function getFriendlyWhyNow(text) {
  const genericFallback = "This recommendation is based on early audience patterns. NIVO will become more confident as it learns from additional content.";
  if (!text) {
    return genericFallback;
  }

  // 1. Perform safe replacements first
  let cleanText = text;
  cleanText = cleanText.replace(/longitudinal history/gi, 'audience patterns over time');
  cleanText = cleanText.replace(/observation pattern/gi, 'content patterns');
  cleanText = cleanText.replace(/insufficient evidence/gi, 'early audience indicators');

  // 2. Perform hard blocking check only after replacements
  const lowercaseText = cleanText.toLowerCase();
  if (
    lowercaseText.includes('insufficient') ||
    lowercaseText.includes('longitudinal') ||
    lowercaseText.includes('observation pattern') ||
    lowercaseText.includes('confidence internals') ||
    lowercaseText.includes('placeholder')
  ) {
    return genericFallback;
  }

  return cleanText;
}
