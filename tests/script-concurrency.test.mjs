import assert from 'node:assert/strict';
import { acquireScriptLock, releaseScriptLock } from '../src/lib/scripts/script-lock.js';

async function runTests() {
  console.log('=== SCRIPT CONCURRENCY LOCK TESTS ===\n');
  let passCount = 0;
  let failCount = 0;

  function runTest(name, fn) {
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passCount++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(err);
      failCount++;
    }
  }

  const USER_A = 'user-a';
  const IDEA_1 = 'idea-1';
  const IDEA_2 = 'idea-2';
  const USER_B = 'user-b';

  runTest('CASE A - FIRST REQUEST: User A + Idea 1 acquires lock', () => {
    releaseScriptLock(USER_A, IDEA_1); // Reset
    const acquired = acquireScriptLock(USER_A, IDEA_1);
    assert.equal(acquired, true);
  });

  runTest('CASE B - IDENTICAL CONCURRENT REQUEST: Blocked', () => {
    const acquired = acquireScriptLock(USER_A, IDEA_1);
    assert.equal(acquired, false, 'Should be blocked by existing lock');
  });

  runTest('CASE C - DIFFERENT IDEA: Not blocked', () => {
    const acquired = acquireScriptLock(USER_A, IDEA_2);
    assert.equal(acquired, true);
    releaseScriptLock(USER_A, IDEA_2); // Cleanup
  });

  runTest('CASE D - DIFFERENT USER: Not blocked', () => {
    const acquired = acquireScriptLock(USER_B, IDEA_1);
    assert.equal(acquired, true);
    releaseScriptLock(USER_B, IDEA_1); // Cleanup
  });

  runTest('CASE E - RELEASE AFTER SUCCESS: Lock can be re-acquired', () => {
    releaseScriptLock(USER_A, IDEA_1);
    const acquired = acquireScriptLock(USER_A, IDEA_1);
    assert.equal(acquired, true);
    releaseScriptLock(USER_A, IDEA_1); // Cleanup
  });

  runTest('CASE F - RELEASE AFTER FAILURE: Same mechanics as success', () => {
    const acquired1 = acquireScriptLock(USER_A, IDEA_1);
    assert.equal(acquired1, true);
    
    // Simulate failure -> release
    releaseScriptLock(USER_A, IDEA_1);
    
    const acquired2 = acquireScriptLock(USER_A, IDEA_1);
    assert.equal(acquired2, true);
    releaseScriptLock(USER_A, IDEA_1);
  });

  console.log(`\nTotals: ${passCount} PASS, ${failCount} FAIL`);
  if (failCount > 0) process.exit(1);
}

runTests().catch(console.error);
