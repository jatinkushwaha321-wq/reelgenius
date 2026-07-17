import { buildReasoningV2Prompt } from '../src/lib/reasoning/build-reasoning-v2-prompt.js';

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) {
    pass++;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

console.log('\n=== BUILD REASONING V2 PROMPT TESTS ===\n');

const mockPacket = {
  creatorContext: {
    displayName: 'Builder Creator',
    niche: 'Engineering'
  },
  selectedSignals: [
    { key: 'high-saves', displayName: 'High saves on code walk-throughs' }
  ],
  recentContent: [],
  topPerformanceContent: []
};

// 1. Prompt Generation Success
console.log('--- 1. Prompt Generation Success ---');
try {
  const prompt = buildReasoningV2Prompt({ packet: mockPacket });
  assert(typeof prompt === 'string' && prompt.length > 0, 'buildReasoningV2Prompt returns a non-empty string prompt');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Required Sections Exist
console.log('\n--- 2. Required Sections Exist ---');
try {
  const prompt = buildReasoningV2Prompt({ packet: mockPacket });

  assert(prompt.includes('1. SYSTEM ROLE'), 'Prompt contains 1. SYSTEM ROLE');
  assert(prompt.includes('2. CREATOR IDENTITY'), 'Prompt contains 2. CREATOR IDENTITY');
  assert(prompt.includes('3. SIGNALS'), 'Prompt contains 3. SIGNALS');
  assert(prompt.includes('4. OBSERVED CONTENT'), 'Prompt contains 4. OBSERVED CONTENT');
  assert(prompt.includes('5. MEMORY CONTEXT'), 'Prompt contains 5. MEMORY CONTEXT');
  assert(prompt.includes('6. REASONING TASK'), 'Prompt contains 6. REASONING TASK');
  assert(prompt.includes('7. OUTPUT CONTRACT'), 'Prompt contains 7. OUTPUT CONTRACT');
  assert(prompt.includes('8. RULES'), 'Prompt contains 8. RULES');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Optional Memory Context
console.log('\n--- 3. Optional Memory Context ---');
try {
  const promptWithoutMemory = buildReasoningV2Prompt({ packet: mockPacket });
  assert(promptWithoutMemory.includes('"memoryContext": null'), 'Gracefully serializes null memoryContext when omitted');

  const mockMemory = {
    previousFailures: ['Do not make generic tips reels']
  };
  const promptWithMemory = buildReasoningV2Prompt({ packet: mockPacket, memoryContext: mockMemory });
  assert(promptWithMemory.includes('Constraint 2') === false, 'Compiles clean prompt without validation failures');
  assert(promptWithMemory.includes('previousFailures'), 'Serialized memoryContext details are injected into supplied context');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Output Contract Instructions Are Present
console.log('\n--- 4. Output Contract Instructions ---');
try {
  const prompt = buildReasoningV2Prompt({ packet: mockPacket });
  assert(prompt.includes('reasoning-engine-v2-schema.js'), 'Prompt references reasoning-engine-v2-schema.js');
  assert(prompt.includes('opportunityPlanning'), 'Output contract includes opportunityPlanning');
  assert(prompt.includes('generationContract'), 'Output contract includes generationContract');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
