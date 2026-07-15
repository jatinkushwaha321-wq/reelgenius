import assert from 'node:assert/strict';
import { validateServerEnvironment } from '../src/lib/env-validator.js';

async function runTests() {
  console.log('=== ENV-VALIDATOR TESTS ===\n');
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

  runTest('CASE A - I: Complete environment passes', () => {
    validateServerEnvironment({
      MONGODB_URI: 'fake_uri',
      AUTH_SECRET: 'fake_secret',
      GEMINI_API_KEY: 'fake_gemini',
      APIFY_API_TOKEN: 'fake_apify'
    });
  });

  runTest('CASE B: MONGODB_URI missing rejects', () => {
    assert.throws(() => {
      validateServerEnvironment({
        AUTH_SECRET: 'fake_secret',
        GEMINI_API_KEY: 'fake_gemini',
        APIFY_API_TOKEN: 'fake_apify'
      });
    }, /Missing required server environment variables: MONGODB_URI/);
  });

  runTest('CASE C: AUTH_SECRET missing rejects', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri',
        GEMINI_API_KEY: 'fake_gemini',
        APIFY_API_TOKEN: 'fake_apify'
      });
    }, /Missing required server environment variables: AUTH_SECRET/);
  });

  runTest('CASE D: GEMINI_API_KEY missing rejects', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri',
        AUTH_SECRET: 'fake_secret',
        APIFY_API_TOKEN: 'fake_apify'
      });
    }, /Missing required server environment variables: GEMINI_API_KEY/);
  });

  runTest('CASE E: APIFY_API_TOKEN missing rejects', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri',
        AUTH_SECRET: 'fake_secret',
        GEMINI_API_KEY: 'fake_gemini'
      });
    }, /Missing required server environment variables: APIFY_API_TOKEN/);
  });

  runTest('CASE F: Blank/whitespace values reject', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri',
        AUTH_SECRET: '   ',
        GEMINI_API_KEY: '',
        APIFY_API_TOKEN: 'fake_apify'
      });
    }, /Missing required server environment variables: AUTH_SECRET, GEMINI_API_KEY/);
  });

  runTest('CASE G: Multiple missing values', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri'
      });
    }, /Missing required server environment variables: AUTH_SECRET, GEMINI_API_KEY, APIFY_API_TOKEN/);
  });

  runTest('CASE H: Secret non-exposure', () => {
    let error;
    try {
      validateServerEnvironment({
        MONGODB_URI: 'FAKE_DB_VALUE_SECRET'
      });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
    assert.ok(!error.message.includes('FAKE_DB_VALUE_SECRET'));
  });

  runTest('CASE J: Stale auth name', () => {
    assert.throws(() => {
      validateServerEnvironment({
        MONGODB_URI: 'fake_uri',
        NEXTAUTH_SECRET: 'fake_secret',
        GEMINI_API_KEY: 'fake_gemini',
        APIFY_API_TOKEN: 'fake_apify'
      });
    }, /Missing required server environment variables: AUTH_SECRET/);
  });

  console.log(`\nTotals: ${passCount} PASS, ${failCount} FAIL`);
  if (failCount > 0) process.exit(1);
}

runTests().catch(console.error);
