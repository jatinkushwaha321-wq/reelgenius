// Set API key and database environment variables before any module loads
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/mock-nivo-database';
process.env.GEMINI_API_KEY = 'mock-api-key';

import mongoose from 'mongoose';
// Mock mongoose.connect to prevent opening a real socket connection
mongoose.connect = async () => mongoose;

import { GoogleGenAI } from '@google/genai';

// Instantiate a temporary client to obtain the internal Models constructor class
const tempClient = new GoogleGenAI({ apiKey: 'mock-api-key' });
const ModelsClass = tempClient.models.constructor;

import { creatorIdentitySchema } from '../src/lib/identity/creator-identity-schema.js';
import { buildCreatorIdentity } from '../src/lib/identity/build-creator-identity.js';
import { loadCreatorIdentity } from '../src/lib/identity/load-creator-identity.js';
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

console.log('\n=== CREATOR IDENTITY LAYER TESTS ===\n');

// 1. Zod Schema Verification
console.log('--- 1. Schema Validation ---');
const validIdentityInput = {
  identity: {
    displayName: 'Test Creator',
    niche: 'Software Development',
    subNiches: ['JavaScript', 'Node.js'],
    contentPillars: [
      { name: 'Tutorials', description: 'Step by step coding', percentage: 70 },
      { name: 'Vlogs', description: 'Day in life', percentage: 30 }
    ],
    aiSummary: 'Technical education creator.',
    strategicDirection: 'Focus on backend systems.'
  },
  beliefs: ['Continuous learning', 'Proof of work'],
  audience: {
    behaviorProfile: 'Aspiring software engineers.',
    interests: ['AI', 'Tech', 'Web Dev'],
    painPoints: ['Passing interviews'],
    desiredIdentity: ''
  },
  communicationStyle: {
    tone: ['Direct', 'Objective'],
    explanationStyle: '',
    storytelling: '',
    frameworks: []
  },
  vocabulary: ['leverage', 'atrophy'],
  decisionFilters: [],
  generationConstraints: []
};

const parseResult = creatorIdentitySchema.safeParse(validIdentityInput);
assert(parseResult.success === true, 'Valid identity input is parsed successfully');

const invalidIdentityInput = {
  ...validIdentityInput,
  identity: {
    ...validIdentityInput.identity,
    contentPillars: [
      { name: 'Invalid Pillar', percentage: 'not-a-number' } // Invalid percentage type
    ]
  }
};

const invalidParseResult = creatorIdentitySchema.safeParse(invalidIdentityInput);
assert(invalidParseResult.success === false, 'Schema rejects invalid percentage type in contentPillars');

// 2. Identity Builder Verification
console.log('\n--- 2. Identity Builder ---');
const mockProfileData = {
  displayName: 'Builder Creator',
  bio: 'Builder bio',
  category: 'Tech',
  niche: 'Engineering',
  subNiches: ['Mongoose', 'MongoDB'],
  contentPillars: [
    { name: 'Databases', description: 'DB setup', percentage: 100 }
  ],
  audiencePersona: {
    behaviorProfile: 'Developers',
    interests: ['Back-end'],
    painPoints: ['Schema design']
  },
  brandIdentity: {
    tone: ['Pragmatic'],
    vocabulary: ['normalize'],
    values: ['Values Tenet'],
    uniqueSellingPoints: ['Agency experience']
  },
  aiSummary: 'Database summary',
  strategicDirection: 'Focus on schema optimization',
  analyzedAt: new Date()
};

const mockSignals = [
  { key: 'signal_one', displayName: 'Signal One', category: 'content-format', confidence: 80, strength: 90 }
];

const builtIdentity = buildCreatorIdentity({ profile: mockProfileData, signals: mockSignals });
assert(builtIdentity.identity.displayName === 'Builder Creator', 'Builder maps displayName correctly');
assert(builtIdentity.identity.niche === 'Engineering', 'Builder maps niche correctly');
assert(builtIdentity.beliefs.length === 0, 'Builder leaves beliefs empty in Milestone 1');
assert(builtIdentity.audience.behaviorProfile === 'Developers', 'Builder maps audience behaviorProfile');
assert(builtIdentity.vocabulary.includes('normalize'), 'Builder maps brand vocabulary');

// 3. Identity Loader & Immutability Verification
console.log('\n--- 3. Identity Loader & Immutability ---');
const loadedIdentity = loadCreatorIdentity({ profile: mockProfileData, signals: mockSignals });
assert(creatorIdentitySchema.safeParse(loadedIdentity).success === true, 'Loaded identity parses successfully through schema');
assert(Object.isFrozen(loadedIdentity) === true, 'Loaded identity object is frozen and immutable');
assert(Object.isFrozen(loadedIdentity.identity) === true, 'Nested identity namespace is frozen');

// 4. Pipeline Integration Verification
console.log('\n--- 4. Pipeline Integration Compatibility ---');

const mockProfileId = new mongoose.Types.ObjectId();
const mockPostId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId().toString();

const pipelineProfile = {
  _id: mockProfileId,
  userId: mockUserId,
  displayName: 'Pipeline Coach',
  bio: 'Helping students break into tech.',
  category: 'Tech & Career',
  niche: 'Student Career / AI / Skills',
  subNiches: ['AI Tools', 'Resume Building'],
  contentPillars: [
    { name: 'Tech Skills', description: 'Coding and SQL tutorials', percentage: 50 },
    { name: 'Career Strategy', description: 'Resume tips', percentage: 50 },
  ],
  audiencePersona: {
    behaviorProfile: 'Students looking for internships',
    interests: ['AI', 'SQL', 'Resumes'],
    painPoints: ['Passing ATS', 'Technical Interviews'],
  },
  brandIdentity: {
    tone: ['Empathetic', 'Structured'],
    vocabulary: ['leverage', 'atrophy', 'compounding'],
    values: ['Continuous learning', 'Actionability'],
    uniqueSellingPoints: ['Real recruiter insights'],
  },
  aiSummary: 'Career growth creator.',
  strategicDirection: 'Focus on coding and tools.',
  analyzedAt: new Date(),
};

const pipelineSignals = [
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

const pipelineObservedContent = [
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

// Mock Mongoose calls
const originalProfileFindOne = CreatorProfile.findOne;
const originalObservedCount = ObservedContent.countDocuments;
const originalObservedFind = ObservedContent.find;
const originalObservedFindOne = ObservedContent.findOne;
const originalSignalFind = Signal.find;
const originalIdeaFind = Idea.find;
const originalMemoryFindOne = AIMemory.findOne;

CreatorProfile.findOne = async () => pipelineProfile;
ObservedContent.countDocuments = async () => 1;
ObservedContent.find = async () => pipelineObservedContent;
ObservedContent.findOne = () => ({
  sort: () => pipelineObservedContent[0]
});
Signal.find = async () => pipelineSignals;
Idea.find = () => ({
  select: () => [],
});
AIMemory.findOne = async () => ({ recentTopics: [] });

// Mock Idea mutations
Idea.countDocuments = async () => 0;
Idea.insertMany = async (docs) => docs.map((d, i) => ({ ...d, _id: new mongoose.Types.ObjectId() }));
Idea.deleteMany = async () => ({ deletedCount: 0 });

let generateContentCalls = [];
ModelsClass.prototype.generateContentInternal = async function (params) {
  const promptText = JSON.stringify(params);
  generateContentCalls.push({ contents: promptText });

  return {
    text: JSON.stringify({
      candidates: [
        {
          requiresPersonalFact: false,
          primarySignalRef: 'sig_001',
          derivationBasis: 'Derived from SQL query guide opportunity.',
          title: 'SQL Live Coding Guide',
          topic: 'SQL Prep',
          concept: 'Step-by-step SQL cheat sheet.',
          format: 'tutorial',
          contentPillar: 'Tech Skills',
          hook: 'Avoid this SQL mistake in your next interview.',
          supportingSignalRefs: ['sig_001'],
          noveltyReason: 'Focuses specifically on indexing.',
        }
      ]
    })
  };
};

async function testPipeline() {
  process.env.ENABLE_REASONING_ENGINE_MVP = 'false';
  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: pipelineProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash',
  });

  assert(result.candidatesCreated === 1, 'Generation pipeline executes successfully with loaded CreatorIdentity');
  assert(result.candidates[0].title === 'SQL Live Coding Guide', 'Prompt context structures and candidate parsing are intact');
}

async function testEquivalence() {
  console.log('\n--- 5. Adapter Equivalence ---');

  const legacyContext = {
    displayName: pipelineProfile.displayName || '',
    bio: pipelineProfile.bio || '',
    category: pipelineProfile.category || '',
    niche: pipelineProfile.niche || '',
    subNiches: pipelineProfile.subNiches || [],
    contentPillars: (pipelineProfile.contentPillars || []).map(cp => ({
      name: cp.name,
      description: cp.description || '',
      percentage: cp.percentage,
    })),
    audiencePersona: {
      behaviorProfile: pipelineProfile.audiencePersona?.behaviorProfile || '',
      interests: pipelineProfile.audiencePersona?.interests || [],
      painPoints: pipelineProfile.audiencePersona?.painPoints || [],
    },
    brandIdentity: {
      tone: pipelineProfile.brandIdentity?.tone || [],
      vocabulary: pipelineProfile.brandIdentity?.vocabulary || [],
      values: [], // values mapped to beliefs is empty in refined Milestone 1
      uniqueSellingPoints: pipelineProfile.brandIdentity?.uniqueSellingPoints || [],
    },
    aiSummary: pipelineProfile.aiSummary || '',
    strategicDirection: pipelineProfile.strategicDirection || '',
    analyzedAt: pipelineProfile.analyzedAt ? new Date(pipelineProfile.analyzedAt).toISOString() : null,
  };

  const identity = loadCreatorIdentity({ profile: pipelineProfile, signals: pipelineSignals });
  const packetWithIdentity = buildIdeaPacket({
    profile: pipelineProfile,
    signals: pipelineSignals,
    observedContent: pipelineObservedContent,
    existingIdeaTitles: [],
    aiMemory: null,
    creatorIdentity: identity,
  });

  const parsedContext = packetWithIdentity.creatorContext;

  // Assert deep equivalence
  assert(parsedContext.displayName === legacyContext.displayName, 'displayName matches legacy');
  assert(parsedContext.bio === legacyContext.bio, 'bio matches legacy');
  assert(parsedContext.category === legacyContext.category, 'category matches legacy');
  assert(parsedContext.niche === legacyContext.niche, 'niche matches legacy');
  assert(parsedContext.subNiches.length === legacyContext.subNiches.length && parsedContext.subNiches[0] === legacyContext.subNiches[0], 'subNiches match legacy');
  assert(parsedContext.contentPillars.length === legacyContext.contentPillars.length && parsedContext.contentPillars[0].name === legacyContext.contentPillars[0].name, 'contentPillars match legacy');
  assert(parsedContext.audiencePersona.behaviorProfile === legacyContext.audiencePersona.behaviorProfile, 'audiencePersona.behaviorProfile matches legacy');
  assert(parsedContext.audiencePersona.interests.length === legacyContext.audiencePersona.interests.length, 'audiencePersona.interests match legacy');
  assert(parsedContext.brandIdentity.tone.length === legacyContext.brandIdentity.tone.length, 'brandIdentity.tone matches legacy');
  assert(parsedContext.brandIdentity.vocabulary.length === legacyContext.brandIdentity.vocabulary.length, 'brandIdentity.vocabulary matches legacy');
  assert(parsedContext.brandIdentity.values.length === 0, 'brandIdentity.values is empty (omitted by design in Milestone 1)');
  assert(parsedContext.brandIdentity.uniqueSellingPoints.length === legacyContext.brandIdentity.uniqueSellingPoints.length, 'brandIdentity.uniqueSellingPoints matches legacy');
  assert(parsedContext.aiSummary === legacyContext.aiSummary, 'aiSummary matches legacy');
  assert(parsedContext.strategicDirection === legacyContext.strategicDirection, 'strategicDirection matches legacy');
  assert(parsedContext.analyzedAt === legacyContext.analyzedAt, 'analyzedAt matches legacy');
}

async function runAllTests() {
  try {
    await testPipeline();
    await testEquivalence();
  } catch (err) {
    console.error(err);
    fail++;
  }

  // Restore mocks
  CreatorProfile.findOne = originalProfileFindOne;
  ObservedContent.countDocuments = originalObservedCount;
  ObservedContent.find = originalObservedFind;
  ObservedContent.findOne = originalObservedFindOne;
  Signal.find = originalSignalFind;
  Idea.find = originalIdeaFind;
  AIMemory.findOne = originalMemoryFindOne;

  console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exit(1);
}

runAllTests();
