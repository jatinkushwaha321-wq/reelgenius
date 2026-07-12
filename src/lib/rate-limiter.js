/**
 * TokenBucketRateLimiter
 * 
 * An in-memory token bucket rate limiter.
 * 
 * Limitation Statement:
 * The V1 in-memory limiter is a best-effort process-local application throttle intended to 
 * reduce burst traffic within an individual server instance. It does not guarantee per-user 
 * or global quota enforcement across serverless or horizontally scaled instances.
 */
export class TokenBucketRateLimiter {
  /**
   * @param {number} limit - Maximum number of tokens the bucket can hold
   * @param {number} intervalMs - Window timeframe in milliseconds (defaults to 1 minute: 60000ms)
   */
  constructor(limit = 10, intervalMs = 60000) {
    this.limit = limit;
    this.intervalMs = intervalMs;
    this.buckets = new Map(); // Stores key -> { tokens, lastRefillTime }
  }

  /**
   * Evaluates request limit status against a given key.
   * 
   * @param {string} key - Caller-provided unique identifier (e.g. userId, IP address)
   * @returns {{allowed: boolean, tokens: number}} Rate limiting result payload
   */
  checkLimit(key) {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    // Initial request: Initialize bucket with (limit - 1) tokens
    if (!bucket) {
      this.buckets.set(key, {
        tokens: this.limit - 1,
        lastRefillTime: now,
      });
      return { allowed: true, tokens: this.limit - 1 };
    }

    // Refill tokens proportional to elapsed time
    const timeElapsed = now - bucket.lastRefillTime;
    const refillAmount = timeElapsed * (this.limit / this.intervalMs);
    const currentTokens = Math.min(this.limit, bucket.tokens + refillAmount);

    // Consume 1 token if available
    if (currentTokens >= 1) {
      this.buckets.set(key, {
        tokens: currentTokens - 1,
        lastRefillTime: now,
      });
      return { allowed: true, tokens: currentTokens - 1 };
    }

    // Deny request
    return { allowed: false, tokens: currentTokens };
  }

  /**
   * Cleans up expired buckets from memory to prevent memory leaks over time.
   */
  prune() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      const timeElapsed = now - bucket.lastRefillTime;
      // If bucket has sat inactive for double the window duration, delete it
      if (timeElapsed > this.intervalMs * 2) {
        this.buckets.delete(key);
      }
    }
  }
}
