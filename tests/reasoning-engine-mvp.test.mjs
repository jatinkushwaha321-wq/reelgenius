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

import { buildReasoningPrompt } from '../src/lib/ideas/build-reasoning-prompt.js';
import { reasoningOutputSchema } from '../src/lib/validations/ideas-generation.js';
import { buildIdeaPrompt } from '../src/lib/ideas/build-idea-prompt.js';
import { buildIdeaPacket } from '../src/lib/ideas/build-idea-packet.js';
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

console.log('\n=== REASONING ENGINE MVP TESTS ===\n');

// 1. Check schemas
assert(typeof reasoningOutputSchema === 'object', 'reasoningOutputSchema is exported');

// Generate valid ObjectIds for Mongoose schema casting
const mockProfileId = new mongoose.Types.ObjectId();
const mockPostId = new mongoose.Types.ObjectId();
const mockUserId = new mongoose.Types.ObjectId().toString();

// Mock data
const mockProfile = {
  _id: mockProfileId,
  userId: mockUserId,
  displayName: 'Tech Career Coach',
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

// Mock Mongoose calls
const originalProfileFindOne = CreatorProfile.findOne;
const originalObservedCount = ObservedContent.countDocuments;
const originalObservedFind = ObservedContent.find;
const originalObservedFindOne = ObservedContent.findOne;
const originalSignalFind = Signal.find;
const originalIdeaFind = Idea.find;
const originalMemoryFindOne = AIMemory.findOne;

CreatorProfile.findOne = async () => mockProfile;
ObservedContent.countDocuments = async () => 1;
ObservedContent.find = async () => mockObservedContent;
ObservedContent.findOne = () => ({
  sort: () => mockObservedContent[0]
});
Signal.find = async () => mockSignals;
Idea.find = () => ({
  select: () => [],
});
AIMemory.findOne = async () => ({ recentTopics: [] });

// Mock Idea.countDocuments/Idea.insertMany/Idea.deleteMany
Idea.countDocuments = async () => 0;
Idea.insertMany = async (docs) => docs.map((d, i) => ({ ...d, _id: new mongoose.Types.ObjectId() }));
Idea.deleteMany = async () => ({ deletedCount: 0 });

// Test in-memory reasoning JSON generation prompt
const mockPacket = buildIdeaPacket({
  profile: mockProfile,
  signals: mockSignals,
  observedContent: mockObservedContent,
  existingIdeaTitles: [],
  aiMemory: null,
});

assert(mockPacket.creatorContext.brandIdentity.vocabulary.includes('leverage'), 'Creator brand identity vocabulary is preserved in packet');
assert(mockPacket.creatorContext.strategicDirection === 'Focus on coding and tools.', 'Creator strategic direction is preserved in packet');

const reasoningPrompt = buildReasoningPrompt({ packet: mockPacket });
assert(reasoningPrompt.includes('observations') && reasoningPrompt.includes('insights') && reasoningPrompt.includes('strategicOpportunities'), 'Reasoning prompt contains the output structure requirements');

// Mock for GoogleGenAI prototype models.generateContentInternal
let generateContentCalls = [];
ModelsClass.prototype.generateContentInternal = async function (params) {
  const promptText = JSON.stringify(params);
  generateContentCalls.push({ contents: promptText });

  if (promptText.includes('cognitive reasoning stage')) {
    return {
      text: JSON.stringify({
        observations: [
          'Obs 1: Tutorials get more saves.',
          'Obs 2: Personal stories get comments.'
        ],
        insights: [
          'Insight 1: Students want actionable templates.'
        ],
        strategicOpportunities: [
          {
            opportunity: 'Share a step-by-step SQL query optimization guide.',
            audienceTension: 'Fear of live coding interviews.',
            creatorLens: 'Use structured guides with leverage vocabulary.',
            suggestedVocabulary: ['leverage'],
            supportedByObservationIndexes: [0]
          },
          {
            opportunity: 'A story on how I failed my first technical test.',
            audienceTension: 'Imposter syndrome in tech.',
            creatorLens: 'Lived experience advice.',
            suggestedVocabulary: ['compounding'],
            supportedByObservationIndexes: [1]
          }
        ],
        rejectedDirections: [
          { topic: 'Top AI Tools', reason: 'Too generic.' }
        ]
      })
    };
  } else {
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
  }
};

async function testPipelineFlagFalse() {
  process.env.ENABLE_REASONING_ENGINE_MVP = 'false';
  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash',
  });

  assert(generateContentCalls.length === 1, 'When flag is false, generateContent is called exactly once');
  assert(!generateContentCalls[0].contents.includes('cognitive reasoning stage'), 'Prompt is for candidates, not reasoning');
}

async function testPipelineFlagTrue() {
  process.env.ENABLE_REASONING_ENGINE_MVP = 'true';
  generateContentCalls = [];

  const result = await runIdeaGeneration({
    profile: mockProfile,
    userId: mockUserId,
    modelName: 'gemini-2.5-flash',
  });

  assert(generateContentCalls.length === 2, 'When flag is true, generateContent is called exactly twice');
  assert(generateContentCalls[0].contents.includes('cognitive reasoning stage'), 'First call prompt is for the reasoning stage');
  assert(!generateContentCalls[1].contents.includes('cognitive reasoning stage'), 'Second call prompt is for candidate ideation');

  // Verify second call prompt consumes reasoningContext
  const secondPrompt = generateContentCalls[1].contents;
  assert(secondPrompt.includes('reasoningContext'), 'Second prompt (ideation) includes reasoningContext');
  assert(secondPrompt.includes('rejectedDirections'), 'Second prompt includes rejectedDirections references');
}

async function runTests() {
  try {
    await testPipelineFlagFalse();
    await testPipelineFlagTrue();
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

runTests();
