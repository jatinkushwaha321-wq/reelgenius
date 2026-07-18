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
import KnowledgeItem from '../src/models/KnowledgeItem.js';

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

console.log('\n=== PIPELINE KNOWLEDGE INTEGRATION TESTS ===\n');

const mockProfileId = new mongoose.Types.ObjectId();
const mockPostId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId().toString();

const mockProfile = {
  _id: mockProfileId,
  userId: mockUserId,
  displayName: 'Tech Creator',
  niche: 'Backend Engineering',
  contentPillars: ['API Design', 'Schema Validation'],
  audiencePersona: {
    demographics: 'Experienced developers',
    painPoints: ['Bad schemas'],
    desires: ['Clean models']
  },
  brandIdentity: {
    voiceStyle: ['Professional'],
    visualThemes: ['Clean Code']
  },
  postingFrequency: 'weekly',
  analyzedAt: new Date()
};

const mockSignals = [
  {
    key: 'sig_001',
    displayName: 'Tutorial Saves',
    category: 'format',
    strength: 90,
    confidence: 85,
    trend: 'stable',
    creatorTrait: 'Walkthroughs',
    audienceBehavior: 'Saves posts',
    directionImplication: 'Do walkthroughs',
    evidence: [{ fact: 'Walkthroughs get saves' }]
  },
  {
    key: 'sig_002',
    displayName: 'Storytime Comments',
    category: 'engagement',
    strength: 80,
    confidence: 75,
    trend: 'rising',
    creatorTrait: 'Personal stories',
    audienceBehavior: 'Comments',
    directionImplication: 'Use storytelling',
    evidence: [{ fact: 'Stories get comments' }]
  },
  {
    key: 'sig_003',
    displayName: 'Checklist Shares',
    category: 'style',
    strength: 75,
    confidence: 70,
    trend: 'rising',
    creatorTrait: 'Checklists',
    audienceBehavior: 'Shares',
    directionImplication: 'Create checklists',
    evidence: [{ fact: 'Checklists get shared' }]
  }
];

const mockObservedContent = [
  {
    _id: mockPostId,
    profileId: mockProfileId,
    caption: 'How to write solid clean code walkthroughs.',
    format: 'listicle',
    likesCount: 100,
    commentsCount: 10,
    publishedAt: new Date()
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

// Mock static outputs
const mockV2Reasoning = JSON.stringify({
  situationAssessment: { observations: ['Tech content fits.'], emergingPatterns: [] },
  identityInterpretation: { identityAlignment: 'Good.', reinforcedBeliefs: [], creatorStrengths: [] },
  audienceInterpretation: { currentState: 'Struggling.', desiredState: 'Clean code.', audienceTensions: ['Validation overhead'] },
  strategicDirection: { positioningThesis: 'Focus on schema design patterns.', strategicGoal: 'Build authority.' },
  opportunityPlanning: [
    { title: 'Deploy Walkthrough Opportunity', creatorPerspective: 'Backend', audienceProblem: 'Complex deployments', supportingEvidence: ['sig_001'], evidenceStrength: 90 }
  ],
  generationContract: { identityConstraints: [], memoryConstraints: [], reasoningConstraints: [] }
});

const mockCandidatesOutput = JSON.stringify({
  candidates: [
    {
      requiresPersonalFact: false,
      primarySignalRef: 'sig_001',
      derivationBasis: 'Walkthrough opportunities perform best.',
      title: 'Zod Schemas Walkthrough Guide',
      topic: 'Zod Schemas',
      concept: 'Deep dive walkthrough of Zod schema configurations.',
      format: 'tutorial',
      contentPillar: 'Schema Validation',
      hook: 'Let us build a production-ready validation pipeline.',
      supportingSignalRefs: ['sig_001'],
      noveltyReason: 'Different topic.'
    }
  ]
});

const approvedEvaluationReport = JSON.stringify({
  _id: '87654321fedcba0987654321',
  identityAlignment: { score: 90, explanation: 'Aligned.' },
  reasoningAlignment: { score: 95, explanation: 'Direct execution.' },
  opportunityFidelity: { score: 90, explanation: 'Fidelity OK.' },
  generationContractCompliance: { score: 100, explanation: 'Full compliance.', violatedConstraints: [] },
  audienceAlignment: { score: 85, explanation: 'Audience OK.' },
  novelty: { score: 80, explanation: 'Novel.' },
  strategicValue: { score: 90, explanation: 'Strategic.' },
  overallVerdict: { recommendation: 'APPROVE', summary: 'Clean and fully approved.' },
  validatedLearnings: ['Creator prefers walkthroughs for advanced patterns.', 'Audience likes schema tips.'],
  rejectionReasons: []
});

let generateContentCalls = [];

// 1. Mode 1 — Knowledge Engine Disabled
console.log('--- 1. Knowledge Engine Disabled Flow ---');
try {
  ModelsClass.prototype.generateContentInternal = async function (params) {
    const promptText = JSON.stringify(params);
    generateContentCalls.push({ contents: promptText });
    if (promptText.includes('primary cognitive reasoning stage of NIVO (Reasoning Engine V2)')) {
      return { text: mockV2Reasoning };
    }
    if (promptText.includes('final cognitive evaluation stage of NIVO (Evaluator V1)')) {
      return { text: approvedEvaluationReport };
    }
    return { text: mockCandidatesOutput };
  };

  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_EVALUATOR_V1 = 'true';
  process.env.ENABLE_KNOWLEDGE_ENGINE_V1 = 'false';

  let findCalled = false;
  let findOneAndUpdateCalled = false;

  KnowledgeItem.find = () => ({
    lean: async () => {
      findCalled = true;
      return [];
    }
  });
  KnowledgeItem.findOneAndUpdate = async () => {
    findOneAndUpdateCalled = true;
    return {};
  };

  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'Successfully generated idea candidate');
  assert(!findCalled, 'Does not read from KnowledgeItem collection when disabled');
  assert(!findOneAndUpdateCalled, 'Does not write to KnowledgeItem collection when disabled');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Mode 2 — Knowledge Engine Enabled
console.log('\n--- 2. Knowledge Engine Enabled Flow ---');
try {
  process.env.ENABLE_REASONING_ENGINE_V2 = 'true';
  process.env.ENABLE_EVALUATOR_V1 = 'true';
  process.env.ENABLE_KNOWLEDGE_ENGINE_V1 = 'true';

  let loadedItems = [];
  let savedItems = [];

  const mockStoredValidatedItem = {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(mockUserId),
    profileId: mockProfileId,
    normalizedStatement: 'Creator prefers TypeScript walkthroughs.',
    category: 'Creator',
    evidenceReferences: [
      {
        evaluationReportId: new mongoose.Types.ObjectId(),
        candidateIdeaId: new mongoose.Types.ObjectId(),
        ideaTitle: 'React walkthrough',
        timestamp: new Date(),
        verdict: 'APPROVE'
      }
    ],
    strengthMetrics: { strength: 60, supportCount: 1, contradictionCount: 0 },
    contradictionHistory: [],
    lifecycleStatus: 'VALIDATED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  KnowledgeItem.find = () => ({
    lean: async () => [mockStoredValidatedItem]
  });

  KnowledgeItem.bulkWrite = async (ops) => {
    ops.forEach(op => {
      if (op.updateOne && op.updateOne.update && op.updateOne.update.$set) {
        savedItems.push(op.updateOne.update.$set);
      }
    });
    return { ok: 1 };
  };

  KnowledgeItem.findOneAndUpdate = async (query, updatePayload) => {
    savedItems.push(updatePayload);
    return updatePayload;
  };

  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash'
  });

  assert(result.candidatesCreated === 1, 'Successfully generated candidates under knowledge mode');
  
  // Verify retrieved context injected in Reasoning prompt
  const reasoningCall = generateContentCalls.find(c => c.contents.includes('primary cognitive reasoning stage of NIVO (Reasoning Engine V2)'));
  assert(reasoningCall.contents.includes('knowledgeContext'), 'Reasoning prompt contains knowledgeContext injection');
  assert(reasoningCall.contents.includes('Creator prefers TypeScript walkthroughs.'), 'Reasoning prompt contains the actual retrieved validated statement');

  // Verify extraction and consolidation saved new candidates
  assert(savedItems.length > 0, 'Saves extracted and consolidated candidates back to database');
  
  // Check if saved items contain normalized extracted statements from report
  const hasLearning1 = savedItems.some(item => item.normalizedStatement.includes('Creator prefers walkthroughs for advanced patterns'));
  const hasLearning2 = savedItems.some(item => item.normalizedStatement.includes('Audience likes schema tips'));
  
  assert(hasLearning1 && hasLearning2, 'Extracted and persisted both validated learnings from approved evaluation report');

  const newSavedItems = savedItems.filter(item => item.normalizedStatement !== 'Creator prefers TypeScript walkthroughs.');
  assert(newSavedItems.every(item => item.lifecycleStatus === 'CANDIDATE'), 'All newly extracted statements are stored with CANDIDATE lifecycle status');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
