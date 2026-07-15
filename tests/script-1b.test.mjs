import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildScriptPacket } from '../src/lib/scripts/build-script-packet.js';
import { buildScriptPrompt } from '../src/lib/scripts/build-script-prompt.js';
import { parseScriptOutput, ScriptHygieneError } from '../src/lib/scripts/parse-script-output.js';
import { persistScript, ScriptFinalizedError, ScriptConflictError } from '../src/lib/scripts/persist-script.js';
import Script from '../src/models/Script.js';

describe('SCRIPT-1B: Script Generation, Hygiene, and Persistence', () => {

  describe('Packet Construction', () => {
    it('builds packet with required fields and excludes forbidden fields (recentScriptSummaries trace)', () => {
      const idea = {
        title: 'Title',
        topic: 'Topic',
        description: 'Desc',
        hook: 'Idea Hook',
        format: 'pov',
        contentPillar: 'Pillar',
        aiSummary: 'Idea AI Summary', // Forbidden
        sourceSignalKeys: ['sig1'], // Allowed in snapshot, but check packet
        directionSnapshot: 'snapshot', // Forbidden
      };
      const profile = {
        niche: 'Dev',
        contentPillars: [{ name: 'Pillar1', description: 'Desc1' }],
        brandIdentity: { tone: ['casual'] },
        audiencePersona: { interests: ['coding'] }, // Forbidden
        bio: 'Bio', // Forbidden
        aiSummary: 'Profile summary', // Forbidden
      };
      const aiMemory = {
        recentTopics: ['T1'],
        recentHooks: ['H1'],
        recentScriptSummaries: ['S1'],
      };

      const packet = buildScriptPacket({ idea, profile, aiMemory });

      assert.strictEqual(packet.idea.title, 'Title');
      assert.strictEqual(packet.idea.topic, 'Topic');
      assert.strictEqual(packet.idea.format, 'pov');
      assert.strictEqual(packet.style.niche, 'Dev');
      assert.deepStrictEqual(packet.style.tone, ['casual']);
      assert.deepStrictEqual(packet.novelty.recentTopics, ['T1']);
      
      // Explicitly checking novelty context propagation
      assert.deepStrictEqual(packet.novelty.recentHooks, ['H1']);
      assert.deepStrictEqual(packet.novelty.recentScriptSummaries, ['S1']);

      assert.strictEqual(packet.idea.aiSummary, undefined);
      assert.strictEqual(packet.style.audiencePersona, undefined);
      assert.strictEqual(packet.style.bio, undefined);
      assert.strictEqual(packet.style.aiSummary, undefined);
      assert.strictEqual(packet.idea.directionSnapshot, undefined);
      assert.strictEqual(packet.idea.sourceSignalKeys, undefined); 
    });
  });

  describe('Prompt Construction', () => {
    it('enforces factual authority, style boundaries, and hygiene boundaries in prompt', () => {
      const packet = buildScriptPacket({ idea: {}, profile: {}, aiMemory: {} });
      const prompt = buildScriptPrompt(packet);

      assert.ok(prompt.includes('CREATIVE DIRECTION ONLY'));
      assert.ok(prompt.includes('MUST NOT invent or assert any creator-specific facts'));
      assert.ok(prompt.includes('DOES NOT authorize creator biography'));
      assert.ok(prompt.includes('DO NOT claim the script is "written in your voice"'));
      assert.ok(prompt.includes('Stable, commonly accepted general domain knowledge is allowed'));
      assert.ok(prompt.includes('health, medical, finance, legal, or safety'));
      assert.ok(prompt.includes('conditional, educational wording'));
      assert.ok(prompt.includes('MUST NOT upgrade a safe Idea into a definitive unsupported efficacy claim'));
      assert.ok(prompt.includes('lands interviews'));
      assert.ok(prompt.includes('Do not project unobserved states onto the audience'));
      assert.ok(prompt.includes('Never expose or mention internal metadata'));
      assert.ok(prompt.includes('\`scriptSummary\` must summarize ONLY'));
    });
  });

  describe('Parser, Gateway, and Hygiene', () => {
    const validScriptJson = (overrides = {}) => JSON.stringify({
      requiresPersonalFact: false,
      hook: 'Conditional educational hook',
      beats: [{ order: 1, spokenContent: 'Some valid words here' }],
      cta: 'Follow for more',
      caption: 'Valid caption',
      scriptSummary: 'A valid summary',
      ...overrides
    });

    it('rejects if requiresPersonalFact is missing', () => {
      assert.throws(() => parseScriptOutput(JSON.stringify({ hook: 'h', beats: [{order: 1, spokenContent: 's'}], scriptSummary: 's' })), /requiresPersonalFact/);
    });

    it('rejects entire script if requiresPersonalFact is true', () => {
      assert.throws(() => parseScriptOutput(validScriptJson({ requiresPersonalFact: true })), (err) => {
        return err instanceof ScriptHygieneError && err.category === 'PERSONAL_FACT_REQUIRED';
      });
    });

    it('proves requiresPersonalFact=false does NOT bypass deterministic hygiene', () => {
      assert.throws(() => parseScriptOutput(validScriptJson({
        requiresPersonalFact: false,
        hook: 'I used to struggle with this' // Autobiography
      })), (err) => {
        return err instanceof ScriptHygieneError && err.category === 'AUTOBIOGRAPHY';
      });
    });

    it('allows conditional hook framing (CONDITIONAL HOOK ALLOW BOUNDARY)', () => {
      const allowed = [
        "could be costing you interviews",
        "might deter recruiters",
        "can help improve resume clarity",
        "may help improve discoverability",
        "tips for improving engagement",
        "how to understand ATS parsing",
        "ATS-aware resume bullets"
      ];
      
      allowed.forEach(hook => {
        const result = parseScriptOutput(validScriptJson({ hook }));
        assert.strictEqual(result.script.hook, hook);
      });
    });

    it('rejects definitive efficacy (DEFINITIVE EFFICACY REJECT BOUNDARY)', () => {
      const rejected = [
        "lands interviews",
        "gets you hired",
        "gets you jobs",
        "guarantees callbacks",
        "beats ATS",
        "passes ATS",
        "doubles engagement",
        "increases views",
        "boosts reach",
        "makes recruiters notice you",
        "guarantees cinematic footage", // cross-niche
        "this exercise eliminates back pain", // medical/high-risk
        "this stock will double", // financial
        "guarantees returns"
      ];
      
      rejected.forEach(text => {
        assert.throws(() => parseScriptOutput(validScriptJson({ hook: text })), (err) => {
          return err instanceof ScriptHygieneError && err.category === 'DEFINITIVE_EFFICACY';
        }, `Failed to reject: ${text}`);
      });
    });

    it('FIELD-BY-FIELD AUTOBIOGRAPHY REJECTION', () => {
      const autobio = "I overcame my fears and struggled a lot";
      
      // 1. hook
      assert.throws(() => parseScriptOutput(validScriptJson({ hook: autobio })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'hook');
      // 2. spokenContent
      assert.throws(() => parseScriptOutput(validScriptJson({ beats: [{ order: 1, spokenContent: autobio }] })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'beats[0].spokenContent');
      // 3. onScreenText
      assert.throws(() => parseScriptOutput(validScriptJson({ beats: [{ order: 1, onScreenText: autobio }] })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'beats[0].onScreenText');
      // 4. visualNote
      assert.throws(() => parseScriptOutput(validScriptJson({ beats: [{ order: 1, visualNote: autobio }] })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'beats[0].visualNote');
      // 5. cta
      assert.throws(() => parseScriptOutput(validScriptJson({ cta: autobio })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'cta');
      // 6. caption
      assert.throws(() => parseScriptOutput(validScriptJson({ caption: autobio })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'caption');
      // 7. scriptSummary
      assert.throws(() => parseScriptOutput(validScriptJson({ scriptSummary: autobio })), err => err.category === 'AUTOBIOGRAPHY' && err.field === 'scriptSummary');
    });

    it('PLACEHOLDER AND NIVO LEAKAGE', () => {
      // A. placeholder in one beat
      assert.throws(() => parseScriptOutput(validScriptJson({ beats: [{ order: 1, spokenContent: '[Insert Name]' }] })), err => err.category === 'PLACEHOLDER' && err.field === 'beats[0].spokenContent');
      
      // B. placeholder in caption
      assert.throws(() => parseScriptOutput(validScriptJson({ caption: '[Link]' })), err => err.category === 'PLACEHOLDER' && err.field === 'caption');
      
      // C. NIVO intelligence in spokenContent
      assert.throws(() => parseScriptOutput(validScriptJson({ beats: [{ order: 1, spokenContent: 'high viral potential' }] })), err => err.category === 'NIVO_INTELLIGENCE' && err.field === 'beats[0].spokenContent');
      
      // D. NIVO intelligence in scriptSummary
      assert.throws(() => parseScriptOutput(validScriptJson({ scriptSummary: 'predicted reach is high' })), err => err.category === 'NIVO_INTELLIGENCE' && err.field === 'scriptSummary');
    });

    it('WORD COUNT EXACT TRACE', () => {
      // Create a fixture where each field has a distinct known word count
      const result = parseScriptOutput(validScriptJson({
        hook: 'One two.', // 2 words
        beats: [
          { order: 1, spokenContent: 'Three four.', onScreenText: 'Ignore this one.', visualNote: 'Ignore this two.' }, // 2 words
          { order: 2, spokenContent: 'Five.' } // 1 word
        ],
        cta: 'Six seven.', // 2 words
        caption: 'Ignore me completely.',
        scriptSummary: 'And ignore me too.',
        totalWordCount: 999 // Prove provider value is overridden
      }));

      // Total words: 2 (hook) + 2 + 1 (spokenContent) + 2 (cta) = 7
      assert.strictEqual(result.totalWordCount, 7);
      
      // Ensure the provider's 999 did NOT become authoritative
      assert.notStrictEqual(result.totalWordCount, 999);
    });

    it('DURATION EXACT TRACE (Formulas)', () => {
      // A. 150 delivery words + 3 beats => 60 seconds
      const words150 = Array(150).fill('w').join(' ');
      const resA = parseScriptOutput(validScriptJson({
        hook: 'hook1',
        cta: '',
        beats: [
          { order: 1, spokenContent: words150 },
          { order: 2, spokenContent: '', onScreenText: 't' },
          { order: 3, spokenContent: '', onScreenText: 't' }
        ],
        estimatedDurationSeconds: 999 // Prove provider value is overridden
      }));
      assert.strictEqual(resA.estimatedDurationSeconds, 60);

      // B. 8 delivery words + 6 beats => 18 seconds
      const words8 = Array(8).fill('word').join(' ');
      const resB = parseScriptOutput(validScriptJson({
        hook: 'hook1',
        cta: '',
        beats: [
          { order: 1, spokenContent: words8 },
          { order: 2, spokenContent: '', onScreenText: 't' },
          { order: 3, spokenContent: '', onScreenText: 't' },
          { order: 4, spokenContent: '', onScreenText: 't' },
          { order: 5, spokenContent: '', onScreenText: 't' },
          { order: 6, spokenContent: '', onScreenText: 't' }
        ]
      }));
      // spoken: (9/150)*60 = 3.6s. floor: 6*3 = 18s. max is 18.
      assert.strictEqual(resB.estimatedDurationSeconds, 18);

      // C. silent visual Script with 8 valid non-empty visual beats => 24 seconds
      const resC = parseScriptOutput(validScriptJson({
        hook: 'hook1',
        cta: '',
        beats: Array(8).fill(null).map((_, i) => ({ order: i + 1, onScreenText: 'text' }))
      }));
      // spoken: 0.4s. floor: 8*3 = 24s. max is 24.
      assert.strictEqual(resC.estimatedDurationSeconds, 24);
    });
  });

  describe('Safe Draft Persistence (Mocked)', () => {
    let originalFindOne, originalFindOneAndReplace, originalCreate, originalFindById;

    before(() => {
      originalFindOne = Script.findOne;
      originalFindOneAndReplace = Script.findOneAndReplace;
      originalCreate = Script.create;
      originalFindById = Script.findById;
    });

    after(() => {
      Script.findOne = originalFindOne;
      Script.findOneAndReplace = originalFindOneAndReplace;
      Script.create = originalCreate;
      Script.findById = originalFindById;
    });

    const makeData = () => ({
      userId: 'user1',
      profileId: 'profile1',
      sourceIdeaId: 'idea1',
      ideaSnapshot: { title: 'Test', hook: 'Hook', format: 'pov' },
      hook: 'Hook',
      beats: [{ order: 1, spokenContent: 'Beat' }],
      scriptSummary: 'Summary',
      estimatedDurationSeconds: 10,
      totalWordCount: 20
    });

    it('creates draft on first generation and ensures requiresPersonalFact is NOT persisted', async () => {
      Script.findOne = async () => null; // no existing
      let savedData;
      Script.create = async (data) => {
        savedData = data;
        return { ...data, _id: 'new_script_id' };
      };

      const persisted = await persistScript(makeData());
      assert.strictEqual(persisted.status, 'draft');
      assert.strictEqual(persisted._id, 'new_script_id');
      assert.strictEqual(Script.schema.paths.requiresPersonalFact, undefined); // Prove not in schema
    });

    it('replaces existing draft on regeneration', async () => {
      Script.findOne = async () => ({ _id: 'script1', status: 'draft' });
      Script.findOneAndReplace = async (query, data) => {
        assert.strictEqual(query.status, 'draft'); // PROVE strict status filter
        return { ...data, _id: query._id };
      };

      const newData = makeData();
      newData.hook = 'Updated Hook';
      const persisted = await persistScript(newData);
      assert.strictEqual(persisted.status, 'draft');
      assert.strictEqual(persisted.hook, 'Updated Hook');
      assert.strictEqual(persisted._id, 'script1');
    });

    it('rejects replacement if existing is final', async () => {
      Script.findOne = async () => ({ _id: 'script2', status: 'final' });

      await assert.rejects(
        persistScript(makeData()),
        (err) => err instanceof ScriptFinalizedError
      );
    });

    it('rejects replacement if draft becomes final concurrently (EXACT DRAFT-TO-FINAL RACE BEHAVIOR)', async () => {
      Script.findOne = async () => ({ _id: 'script3', status: 'draft' });
      Script.findOneAndReplace = async () => null; // simulate it didn't match the {status: 'draft'} filter
      Script.findById = async () => ({ _id: 'script3', status: 'final' }); // now it's final

      await assert.rejects(
        persistScript(makeData()),
        (err) => err instanceof ScriptFinalizedError
      );
    });

    it('duplicate key creation is handled (CONCURRENT FIRST-CREATION TRACE)', async () => {
      Script.findOne = async () => null;
      Script.create = async () => {
        const error = new Error('E11000 duplicate key error');
        error.code = 11000;
        error.keyPattern = { sourceIdeaId: 1 };
        throw error;
      };
      
      await assert.rejects(
        persistScript(makeData()),
        (err) => err instanceof ScriptConflictError
      );
    });
  });
});
