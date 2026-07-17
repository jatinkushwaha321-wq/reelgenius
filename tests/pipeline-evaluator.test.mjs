process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/mock-nivo-database';
process.env.GEMINI_API_KEY = 'mock-api-key';

import mongoose from 'mongoose';
mongoose.connect = async () => mongoose;

import { GoogleGenAI } from '@google/genai';
const tempClient = new GoogleGenAI({ apiKey: 'mock-api-key' });
const ModelsClass = tempClient.models.constructor;

import { runIdeaGeneration } from '../src/lib/ideas/run-idea-generation.js';
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

console.log('\n=== PIPELINE EVALUATOR INTEGRATION TESTS ===\n');

const mockProfileId = new mongoose.Types.ObjectId();
const mockPostId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId().toString();

const mockProfile = {
  _id: mockProfileId,
  userId: mockUserId,
  displayName: 'Tech Lead Creator',
  niche: 'AI Engineering',
  contentPillars: ['Architecture Patterns', 'Zod Schemas'],
  audiencePersona: {
    demographics: 'Experienced developers',
    painPoints: ['Complex validations'],
    desires: ['Clean type safety']
  },
  brandIdentity: {
    voiceStyle: ['Professional', 'Authoritative'],
    visualThemes: ['Dark mode code listings']
  },
  postingFrequency: 'weekly',
  analyzedAt: new Date()
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
  }
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

const validV2JsonOutput = JSON.stringify({
  situationAssessment: { observations: ['SQL is high.'], emergingPatterns: [] },
  identityInterpretation: { identityAlignment: 'Coaching', reinforcedBeliefs: [], creatorStrengths: [] },
  audienceInterpretation: { currentState: 'Stressed', desiredState: 'Stable', audienceTensions: ['Lack of concrete resource blueprints'] },
  strategicDirection: { positioningThesis: 'Focus strictly on concrete resume metrics.', strategicGoal: 'Position as resume mentor.' },
  opportunityPlanning: [{ title: 'SQL Guide', creatorPerspective: 'Performance', audienceProblem: 'Rejects', supportingEvidence: ['sig_001'], evidenceStrength: 90 }],
  generationContract: { identityConstraints: [], memoryConstraints: [], reasoningConstraints: [] }
});

const mockCandidatesOutput = JSON.stringify({
  candidates: [
    {
      requiresPersonalFact: false,
      primarySignalRef: 'sig_001',
      derivationBasis: 'Derived opportunity.',
      title: 'SQL Metrics Guide',
      topic: 'SQL Prep',
      concept: 'Step-by-step tutorial.',
      format: 'tutorial',
      contentPillar: 'Tech Skills',
      hook: 'Avoid this SQL mistake.',
      supportingSignalRefs: ['sig_001'],
      noveltyReason: 'Focuses specifically on indexing.',
    },
    {
      requiresPersonalFact: false,
      primarySignalRef: 'sig_001',
      derivationBasis: 'Derived opportunity.',
      title: 'Zod Validation Checklist',
      topic: 'Zod Prep',
      concept: 'Step-by-step tutorial.',
      format: 'tutorial',
      contentPillar: 'Tech Skills',
      hook: 'Avoid this Zod mistake.',
      supportingSignalRefs: ['sig_001'],
      noveltyReason: 'Focuses specifically on validation.',
    }
  ]
});

const approvedEvaluationReport = JSON.stringify({
  identityAlignment: { score: 95, explanation: 'Strong niche fit.' },
  reasoningAlignment: { score: 90, explanation: 'Matches thesis.' },
  opportunityFidelity: { score: 95, explanation: 'Faithful execution.' },
  generationContractCompliance: { score: 100, explanation: 'No constraints violated.', violatedConstraints: [] },
  audienceAlignment: { score: 85, explanation: 'Addresses developer pain points.' },
  novelty: { score: 80, explanation: 'Different from last posts.' },
  strategicValue: { score: 90, explanation: 'Strengthens positioning.' },
  overallVerdict: { recommendation: 'APPROVE', summary: 'Highly aligned.' },
  validatedLearnings: [],
  rejectionReasons: []
});

const rejectedEvaluationReport = JSON.stringify({
  identityAlignment: { score: 40, explanation: 'Weak niche fit.' },
  reasoningAlignment: { score: 35, explanation: 'Drifts from thesis.' },
  opportunityFidelity: { score: 50, explanation: 'Poor execution.' },
  generationContractCompliance: { score: 100, explanation: 'No constraints violated.', violatedConstraints: [] },
  audienceAlignment: { score: 60, explanation: 'Addresses developer pain points.' },
  novelty: { score: 80, explanation: 'Different.' },
  strategicValue: { score: 45, explanation: 'Strengthens positioning.' },
  overallVerdict: { recommendation: 'REJECT', summary: 'Out of scope.' },
  validatedLearnings: [],
  rejectionReasons: ['Weak niche alignment']
});

let generateContentCalls = [];

// Dynamic response routing for mock LLM
ModelsClass.prototype.generateContentInternal = async function (params) {
  const promptText = JSON.stringify(params);
  generateContentCalls.push({ contents: promptText });

  if (promptText.includes('primary cognitive reasoning stage of NIVO (Reasoning Engine V2)')) {
    return { text: validV2JsonOutput };
  }
  if (promptText.includes('final cognitive evaluation stage of NIVO (Evaluator V1)')) {
    if (promptText.includes('Zod Validation Checklist')) {
      return { text: rejectedEvaluationReport };
    }
    return { text: approvedEvaluationReport };
  }
  return { text: mockCandidatesOutput };
};

// 1. Evaluator Disabled Path & Backward Compatibility
console.log('--- 1. Evaluator Disabled Path ---');
try {
  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_EVALUATOR_V1 = 'false';
  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 2, 'Returns both candidates when evaluator is disabled');
  assert(!generateContentCalls.some(c => c.contents.includes('final cognitive evaluation stage')), 'No evaluation calls were dispatched');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Evaluator Enabled Path & Approval Policy
console.log('\n--- 2. Evaluator Enabled Path ---');
try {
  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_EVALUATOR_V1 = 'true';
  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'Only approved candidate continues through production output');
  assert(result.candidates[0].title === 'SQL Metrics Guide', 'Correct candidate approved');
  assert(result.candidates[0].evaluationReport !== undefined, 'Approved candidate has the Evaluation Report attached');
  assert(result.candidates[0].evaluationReport.overallVerdict.recommendation === 'APPROVE', 'Evaluation report contains APPROVE recommendation');
  
  const evalCalls = generateContentCalls.filter(c => c.contents.includes('final cognitive evaluation stage'));
  assert(evalCalls.length === 2, 'Evaluator was invoked exactly once for each of the 2 generated candidates');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Complete Rejection (No approved candidates)
console.log('\n--- 3. Complete Rejection Handling ---');
try {
  ModelsClass.prototype.generateContentInternal = async function (params) {
    const promptText = JSON.stringify(params);
    generateContentCalls.push({ contents: promptText });
    if (promptText.includes('primary cognitive reasoning stage of NIVO (Reasoning Engine V2)')) {
      return { text: validV2JsonOutput };
    }
    if (promptText.includes('final cognitive evaluation stage of NIVO (Evaluator V1)')) {
      return { text: rejectedEvaluationReport };
    }
    return { text: mockCandidatesOutput };
  };

  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_EVALUATOR_V1 = 'true';
  generateContentCalls = [];

  await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });
  assert(false, 'Should fail when all candidates fail evaluation');
} catch (err) {
  assert(err.code === 'NO_VALID_CANDIDATES' && err.message.includes('failed evaluation'), 'Correctly throws NO_VALID_CANDIDATES exception when all fail evaluation');
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
