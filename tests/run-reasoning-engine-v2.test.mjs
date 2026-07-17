process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/mock-nivo-database';
process.env.GEMINI_API_KEY = 'mock-api-key';

import mongoose from 'mongoose';
mongoose.connect = async () => mongoose;

import { GoogleGenAI } from '@google/genai';
const tempClient = new GoogleGenAI({ apiKey: 'mock-api-key' });
const ModelsClass = tempClient.models.constructor;

import { runReasoningEngineV2 } from '../src/lib/reasoning/run-reasoning-engine-v2.js';
import { runIdeaGeneration } from '../src/lib/ideas/run-idea-generation.js';
import { buildIdeaPacket } from '../src/lib/ideas/build-idea-packet.js';
import CreatorProfile from '../src/models/CreatorProfile.js';
import ObservedContent from '../src/models/ObservedContent.js';
import Signal from '../src/models/Signal.js';
import Idea from '../src/models/Idea.js';
import AIMemory from '../src/models/AIMemory.js';

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

console.log('\n=== RUN REASONING ENGINE V2 TESTS ===\n');

const mockProfileId = new mongoose.Types.ObjectId();
const mockPostId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId().toString();

const mockProfile = {
  _id: mockProfileId,
  userId: mockUserId,
  displayName: 'V2 Test Creator',
  bio: 'Helping students break into tech.',
  category: 'Tech & Career',
  niche: 'Student Career / AI / Skills',
  subNiches: ['AI Tools', 'Resume Building'],
  contentPillars: [
    { name: 'Tech Skills', description: 'Coding and SQL tutorials', percentage: 50 }
  ],
  audiencePersona: {
    behaviorProfile: 'Students looking for internships',
    interests: ['AI', 'SQL', 'Resumes'],
    painPoints: ['Passing ATS', 'Technical Interviews'],
  },
  brandIdentity: {
    tone: ['Empathetic', 'Structured'],
    vocabulary: ['leverage', 'atrophy'],
    values: ['Continuous learning', 'Actionability'],
    uniqueSellingPoints: ['Real recruiter insights'],
  },
  aiSummary: 'Career growth creator.',
  strategicDirection: 'Focus on coding and tools.',
  analyzedAt: new Date(),
};

const mockSignals = [
  {
    key: 'tutorials_get_saves',
    displayName: 'Tutorials Get Saves',
    category: 'content-format',
    strength: 90,
    confidence: 85,
    trend: 'stable',
    creatorTrait: 'Uses step-by-step guides.',
    audienceBehavior: 'Saves posts for later.',
    directionImplication: 'Create listicle-based tutorials.',
    evidence: [{ fact: 'Carousel posts on SQL get 2x saves.' }],
  },
  {
    key: 'personal_stories_get_comments',
    displayName: 'Personal Stories Get Comments',
    category: 'audience-engagement',
    strength: 80,
    confidence: 75,
    trend: 'rising',
    creatorTrait: 'Shares personal struggle.',
    audienceBehavior: 'Asks questions in comments.',
    directionImplication: 'Incorporate storytime hooks.',
    evidence: [{ fact: 'Post about quitting Google got 100 comments.' }],
  },
  {
    key: 'ats_tips_high_reach',
    displayName: 'ATS Tips High Reach',
    category: 'creator-style',
    strength: 75,
    confidence: 70,
    trend: 'rising',
    creatorTrait: 'Provides template checklists.',
    audienceBehavior: 'Shares and saves.',
    directionImplication: 'Share resume checklists.',
    evidence: [{ fact: 'Resume template post was shared 200 times.' }],
  },
];

const mockObservedContent = [
  {
    _id: mockPostId,
    profileId: mockProfileId,
    caption: 'How to write an ATS-friendly resume from scratch.',
    format: 'listicle',
    likesCount: 100,
    commentsCount: 10,
    publishedAt: new Date(),
  },
];

// Mock database models
CreatorProfile.findOne = async () => mockProfile;
ObservedContent.countDocuments = async () => 1;
ObservedContent.find = async () => mockObservedContent;
ObservedContent.findOne = () => ({ sort: () => mockObservedContent[0] });
Signal.find = async () => mockSignals;
Idea.find = () => ({ select: () => [] });
Idea.countDocuments = async () => 0;
Idea.insertMany = async (docs) => docs.map(d => ({ ...d, _id: new mongoose.Types.ObjectId() }));
Idea.deleteMany = async () => ({ deletedCount: 0 });
AIMemory.findOne = async () => ({ recentTopics: [] });

// Assembled mock packet
const testPacket = buildIdeaPacket({
  profile: mockProfile,
  signals: mockSignals,
  observedContent: mockObservedContent,
  existingIdeaTitles: [],
  aiMemory: null,
});

// Configure dynamic mock responses
let nextResponseText = '';
let shouldThrow = false;
let generateContentCalls = [];

ModelsClass.prototype.generateContentInternal = async function (params) {
  const promptText = JSON.stringify(params);
  generateContentCalls.push({ contents: promptText });

  if (shouldThrow) {
    throw new Error('LLM Exception simulated');
  }

  return { text: nextResponseText };
};

const validV2JsonOutput = JSON.stringify({
  situationAssessment: {
    observations: ['Obs A: SQL reels saves are high.'],
    emergingPatterns: ['Pattern: List format is preferred.']
  },
  identityInterpretation: {
    identityAlignment: 'Highly aligned with career coaching.',
    reinforcedBeliefs: ['Skills over credentials'],
    creatorStrengths: ['Technical accuracy']
  },
  audienceInterpretation: {
    currentState: 'Struggling to clear resumes.',
    desiredState: 'Configuring clean profiles.',
    audienceTensions: ['Generic templates fatigue']
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
      supportingEvidence: ['Tutorials get saves signal'],
      evidenceStrength: 90
    }
  ],
  generationContract: {
    identityConstraints: [],
    memoryConstraints: [],
    reasoningConstraints: []
  }
});

// 1. Successful Execution & Schema Validation
console.log('--- 1. Successful Execution & Schema Validation ---');
try {
  nextResponseText = validV2JsonOutput;
  shouldThrow = false;
  generateContentCalls = [];

  const result = await runReasoningEngineV2({
    packet: testPacket,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.strategicDirection.positioningThesis === 'Focus strictly on concrete resume metrics.', 'V2 Runner successfully returns validated reasoning contract');
  assert(generateContentCalls.length === 1, 'Triggers Gemini generation precisely once');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Malformed JSON Rejection
console.log('\n--- 2. Malformed JSON Rejection ---');
try {
  nextResponseText = 'invalid json {';
  shouldThrow = false;
  generateContentCalls = [];

  await runReasoningEngineV2({
    packet: testPacket,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });
  assert(false, 'Should throw on malformed JSON');
} catch (err) {
  assert(err.code === 'INVALID_STRUCTURED_OUTPUT', 'Runner propagates error on malformed JSON');
}

// 3. LLM Exception Handling
console.log('\n--- 3. LLM Exception Handling ---');
try {
  shouldThrow = true;
  generateContentCalls = [];

  await runReasoningEngineV2({
    packet: testPacket,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });
  assert(false, 'Should throw on LLM Exception');
} catch (err) {
  assert(err.code === 'PROVIDER_ERROR' && err.cause.message === 'LLM Exception simulated', 'Runner propagates exception wrapped by Gemini client wrapper');
}

// 4. Feature Flag Routing Integration
console.log('\n--- 4. Feature Flag Routing Integration ---');
try {
  // Candidate mock
  const mockCandidatesOutput = JSON.stringify({
    candidates: [
      {
        requiresPersonalFact: false,
        primarySignalRef: 'sig_001',
        derivationBasis: 'Derived from SQL formatting guide opportunity.',
        title: 'SQL Metrics Guide',
        topic: 'SQL Prep',
        concept: 'Step-by-step SQL metrics tutorial.',
        format: 'tutorial',
        contentPillar: 'Tech Skills',
        hook: 'Avoid this SQL mistake in your next interview.',
        supportingSignalRefs: ['sig_001'],
        noveltyReason: 'Focuses specifically on indexing.',
      }
    ]
  });

  const mockMvpOutput = JSON.stringify({
    observations: ['Obs MVP', 'Obs MVP 2'],
    insights: ['Insight MVP'],
    strategicOpportunities: [
      {
        opportunity: 'Share query optimization guide',
        audienceTension: 'Fear of interview',
        creatorLens: 'Use vocabulary',
        suggestedVocabulary: ['leverage'],
        supportedByObservationIndexes: [0]
      },
      {
        opportunity: 'Share query optimization guide 2',
        audienceTension: 'Fear of interview 2',
        creatorLens: 'Use vocabulary 2',
        suggestedVocabulary: ['leverage'],
        supportedByObservationIndexes: [1]
      }
    ],
    rejectedDirections: [{ topic: 'Top Tools', reason: 'Generic' }]
  });

  // Intercept generateContentInternal to route outputs dynamically based on flags
  ModelsClass.prototype.generateContentInternal = async function (params) {
    const promptText = JSON.stringify(params);
    generateContentCalls.push({ contents: promptText });
    
    if (promptText.includes('primary cognitive reasoning stage of NIVO (Reasoning Engine V2)')) {
      return { text: validV2JsonOutput };
    }
    if (promptText.includes('You are the primary cognitive reasoning stage of NIVO, a Creator Intelligence platform.')) {
      return { text: mockMvpOutput };
    }
    return { text: mockCandidatesOutput };
  };

  // Test Case A: ENABLE_REASONING_ENGINE_V2 = 'true', ENABLE_REASONING_ENGINE_MVP = 'false'
  console.log('  Testing Mode: V2 active, MVP inactive...');
  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_REASONING_ENGINE_MVP = 'false';
  shouldThrow = false;
  generateContentCalls = [];

  let result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'V2 execution runs successfully');
  assert(generateContentCalls.some(c => c.contents.includes('Reasoning Engine V2')), 'V2 prompt is compiled and called');
  assert(!generateContentCalls.some(c => c.contents.includes('You are the primary cognitive reasoning stage of NIVO, a Creator Intelligence platform.')), 'MVP path is bypassed');

  // Test Case B: Both V2 and MVP are 'false' (no reasoning)
  console.log('  Testing Mode: Both V2 and MVP inactive...');
  process.env.ENABLE_REASONING_ENGINE_V2 = 'false';
  process.env.ENABLE_REASONING_ENGINE_MVP = 'false';
  generateContentCalls = [];

  result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'No-reasoning execution runs successfully');
  assert(generateContentCalls.length === 1, 'Only a single call to Gemini is made (ideation stage)');
  assert(!generateContentCalls[0].contents.includes('cognitive reasoning stage'), 'No reasoning prompts are constructed or dispatched');

  // Test Case C: V2 = 'false', MVP = 'true'
  console.log('  Testing Mode: V2 inactive, MVP active...');
  process.env.ENABLE_REASONING_ENGINE_V2 = 'false';
  process.env.ENABLE_REASONING_ENGINE_MVP = 'true';
  generateContentCalls = [];

  result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'Legacy MVP execution runs successfully');
  assert(generateContentCalls.length === 2, 'Two calls made to Gemini (MVP reasoning + ideation)');
  assert(generateContentCalls.some(c => c.contents.includes('You are the primary cognitive reasoning stage of NIVO, a Creator Intelligence platform.')), 'Legacy MVP prompt is triggered');

  // Test Case D: Both V2 and MVP are 'true' (V2 precedence validation)
  console.log('  Testing Mode: Both V2 and MVP active (V2 precedence check)...');
  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_REASONING_ENGINE_MVP = 'true';
  generateContentCalls = [];

  result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'Dual-active execution runs successfully');
  assert(generateContentCalls.some(c => c.contents.includes('Reasoning Engine V2')), 'V2 prompt is triggered under V2 precedence');
  assert(!generateContentCalls.some(c => c.contents.includes('You are the primary cognitive reasoning stage of NIVO, a Creator Intelligence platform.')), 'Legacy MVP is bypassed');

} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
