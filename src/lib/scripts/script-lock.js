const activeScriptGenerations = new Set();

export function acquireScriptLock(userId, ideaId) {
  const lockKey = `${userId}:${ideaId}`;
  if (activeScriptGenerations.has(lockKey)) {
    return false; // Already active
  }
  activeScriptGenerations.add(lockKey);
  return true; // Acquired successfully
}

export function releaseScriptLock(userId, ideaId) {
  const lockKey = `${userId}:${ideaId}`;
  activeScriptGenerations.delete(lockKey);
}
