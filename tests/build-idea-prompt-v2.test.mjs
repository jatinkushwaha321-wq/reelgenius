import { buildIdeaPrompt } from '../src/lib/ideas/build-idea-prompt.js';

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

console.log('\n=== BUILD IDEA PROMPT V2 INTEGRATION TESTS ===\n');

const mockV2Contract = {
  situationAssessment: {
    observations: ['Obs A: SQL reels saves are high.'],
    emergingPatterns: []
  },
  identityInterpretation: {
    identityAlignment: 'Highly aligned with career coaching.',
    reinforcedBeliefs: ['Skills over credentials'],
    creatorStrengths: []
  },
  audienceInterpretation: {
    currentState: 'Struggling to clear resumes.',
    desiredState: 'Configuring clean profiles.',
    audienceTensions: []
  },
  strategicDirection: {
    positioningThesis: 'Focus strictly on concrete resume metrics.',
    strategicGoal: 'Position as a metric-driven career mentor.'
  },
  opportunityPlanning: [
    {
      title: 'SQL formatting guide',
      creatorPerspective: 'Focus on database performance listing',
      audienceProblem: 'Generic formatting rejects',
      supportingEvidence: ['sig_001'],
      evidenceStrength: 90
    }
  ],
  generationContract: {
    identityConstraints: ['Do not list generic resume checklist tools'],
    memoryConstraints: [],
    reasoningConstraints: []
  }
};

const mockPacket = {
  creatorContext: {
    displayName: 'V2 Test Creator'
  },
  reasoningContext: null,
  noveltyContext: {
    recentTopics: [],
    existingIdeaTitles: []
  }
};

const mockOutputContract = {
  candidates: []
};

// 1. V2 Contract Consumption & Formatting
console.log('--- 1. V2 Contract Integration ---');
try {
  const packetV2 = {
    ...mockPacket,
    reasoningContext: mockV2Contract
  };

  const prompt = buildIdeaPrompt({ packet: packetV2, outputContract: mockOutputContract });

  assert(prompt.includes('Reasoning Engine V2 contract'), 'Prompt targets V2 reasoning instructions');
  assert(prompt.includes('Focus strictly on concrete resume metrics.'), 'Positioning thesis is rendered in supplied context');
  assert(prompt.includes('SQL formatting guide'), 'Opportunities are present in the serialized context');
  assert(prompt.includes('Do not list generic resume checklist tools'), 'Generation constraints are preserved');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Legacy Fallback Path Backwards Compatibility
console.log('\n--- 2. Legacy Backwards Compatibility ---');
try {
  // Test Case A: Fallback with no reasoning context
  const fallbackPrompt = buildIdeaPrompt({ packet: mockPacket, outputContract: mockOutputContract });
  assert(fallbackPrompt.includes('highly specific, actionable content Idea candidates') && !fallbackPrompt.includes('Reasoning Engine V2'), 'Fallback path with no reasoning works');

  // Test Case B: Legacy MVP reasoning context
  process.env.ENABLE_REASONING_ENGINE_MVP = 'true';
  const legacyMVPContract = {
    observations: ['Obs A'],
    insights: ['Insight B'],
    strategicOpportunities: [
      { opportunity: 'MVP opportunity link', audienceTension: 'Tension', creatorLens: 'Lens', suggestedVocabulary: [], supportedByObservationIndexes: [0] }
    ],
    rejectedDirections: []
  };

  const packetMVP = {
    ...mockPacket,
    reasoningContext: legacyMVPContract
  };

  const mvpPrompt = buildIdeaPrompt({ packet: packetMVP, outputContract: mockOutputContract });
  assert(mvpPrompt.includes('pre-computed reasoning context') && !mvpPrompt.includes('Reasoning Engine V2'), 'Legacy MVP reasoning prompt path remains fully operational');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
