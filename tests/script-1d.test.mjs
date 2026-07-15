import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildScriptPacket } from '../src/lib/scripts/build-script-packet.js';
import { buildScriptPrompt } from '../src/lib/scripts/build-script-prompt.js';
import Idea from '../src/models/Idea.js';

describe('SCRIPT-1D: Short-Form Creative Quality Contract', () => {
  
  describe('A. Packet Correction', () => {
    it('1. creativeDirection maps exactly from directionSnapshot', () => {
      const idea = { directionSnapshot: 'Focus on advanced hooks.' };
      const packet = buildScriptPacket({ idea, profile: {} });
      assert.strictEqual(packet.idea.creativeDirection, 'Focus on advanced hooks.');
    });

    it('2. targetDuration and estimatedDuration are omitted', () => {
      const idea = { estimatedDuration: '45s' };
      const packet = buildScriptPacket({ idea, profile: {} });
      assert.strictEqual(packet.idea.targetDuration, undefined);
      assert.strictEqual(packet.idea.estimatedDuration, undefined);
    });

    it('3. Existing Idea packet fields remain present and unchanged', () => {
      const idea = {
        title: 'Title',
        topic: 'Topic',
        description: 'Desc',
        hook: 'Hook',
        format: 'tutorial',
        contentPillar: 'Pillar'
      };
      const packet = buildScriptPacket({ idea, profile: {} });
      assert.strictEqual(packet.idea.title, 'Title');
      assert.strictEqual(packet.idea.topic, 'Topic');
      assert.strictEqual(packet.idea.description, 'Desc');
      assert.strictEqual(packet.idea.hook, 'Hook');
      assert.strictEqual(packet.idea.format, 'tutorial');
      assert.strictEqual(packet.idea.contentPillar, 'Pillar');
    });

    it('4. Raw intelligence fields remain excluded', () => {
      const idea = {
        sourceSignalKeys: ['sig1'],
        sourceSignalSnapshots: [{}],
        whyNow: 'Timing',
        noveltyReason: 'Reason',
        rankKey: 1,
        generationRunId: 'gen1'
      };
      const packet = buildScriptPacket({ idea, profile: {} });
      assert.strictEqual(packet.idea.sourceSignalKeys, undefined);
      assert.strictEqual(packet.idea.sourceSignalSnapshots, undefined);
      assert.strictEqual(packet.idea.whyNow, undefined);
      assert.strictEqual(packet.idea.noveltyReason, undefined);
      assert.strictEqual(packet.idea.rankKey, undefined);
      assert.strictEqual(packet.idea.generationRunId, undefined);
    });

    it('5. Live Idea model duration behavior is verified (but omitted from packet)', () => {
      // The Idea model schema contains estimatedDuration. We check that it exists on the model but is omitted from packet.
      const ideaDoc = new Idea({ userId: '60c72b2f5f1b2c001f3e1b2a', profileId: '60c72b2f5f1b2c001f3e1b2b', title: 'Test' });
      // Default in mongoose is '30s'
      assert.strictEqual(ideaDoc.estimatedDuration, '30s');
      
      const packet = buildScriptPacket({ idea: ideaDoc, profile: {} });
      assert.strictEqual(packet.idea.targetDuration, undefined); 
      assert.strictEqual(packet.idea.estimatedDuration, undefined);
    });
  });

  describe('B. Prompt Assertions', () => {
    let promptText;

    before(() => {
      const packet = buildScriptPacket({ idea: {}, profile: {} });
      promptText = buildScriptPrompt(packet);
    });

    it('6. Contains meaningful source-level instructions for adaptive short-form pacing', () => {
      assert.ok(!promptText.includes('targetDuration'));
      assert.ok(!promptText.includes('respect a fixed 30-second target'));
      assert.ok(!promptText.includes('45-second, 60-second, or 90-second'));
      assert.ok(promptText.includes('ADAPTIVE PACING'));
      assert.ok(promptText.includes('smallest amount of Script content necessary'));
      assert.ok(promptText.includes('FORMAT-AWARE: A tutorial, listicle, storytime, or POV may naturally require different pacing'));
      assert.ok(promptText.includes('COMPLEXITY-AWARE: A simple Idea may be executed in a small number of dense beats. A complex educational or explanatory Idea may require more beats'));
      assert.ok(promptText.includes('NO PADDING OR OVER-COMPRESSION: Do not add filler'));
      assert.ok(promptText.includes('do not over-compress a complex topic'));
    });



    it('8. Beat density: each beat earning its place', () => {
      assert.ok(promptText.includes('Every beat must earn its place'));
      assert.ok(promptText.includes('new information, a concrete example, tension, contrast, proof/demonstration, narrative progression, or a meaningful visual progression'));
    });

    it('9. Anti-filler: Beats advancing beyond the hook and no hook restatement', () => {
      assert.ok(promptText.includes('DO NOT restate the hook in Beat 1'));
      assert.ok(promptText.includes('beats must advance beyond it'));
    });

    it('10. No pure transition beats', () => {
      assert.ok(promptText.includes('DO NOT create pure transition beats'));
    });

    it('11. Anti-filler / low-information motivational padding avoidance', () => {
      assert.ok(promptText.includes("You've got this!"));
      assert.ok(promptText.includes("You're not alone!"));
      assert.ok(promptText.includes("Let's build something awesome together!"));
    });

    it('12. Persuasive and conditional creator copy remains allowed', () => {
      assert.ok(promptText.includes('Persuasive creator copy, conditional outcomes, general domain knowledge, and aspirational language are allowed'));
    });

    it('13. Concrete shootable/editable visual direction', () => {
      assert.ok(promptText.includes('concrete camera shot, specific B-roll, screen recording, physical action, prop/object interaction, before/after comparison'));
    });

    it('14. Visual direction tied to the spoken beat and avoidance of slide-transition defaults', () => {
      assert.ok(promptText.includes('visual must relate to the specific spoken beat'));
      assert.ok(promptText.includes('AVOID vague mood-only or presentation-like notes'));
      assert.ok(promptText.includes('transition to step 2 graphic'));
    });

    it('15. Caption complement/value-add behavior', () => {
      assert.ok(promptText.includes('caption` must complement the Script, not simply summarize or paraphrase'));
      assert.ok(promptText.includes('Hashtags are allowed; prefer a small set of topic-specific hashtags'));
    });

    it('16. creativeDirection is directional context only', () => {
      assert.ok(promptText.includes('creativeDirection` field provided in the input is directional creative context'));
    });

    it('17. creativeDirection is not evidence or autobiographical authority', () => {
      assert.ok(promptText.includes('NOT proof of audience behavior, creator history, or creator preference'));
      assert.ok(promptText.includes('NOT authority to fabricate autobiographical statements, performance predictions, or efficacy guarantees'));
    });

    it('18. Raw NIVO intelligence must not be exposed', () => {
      assert.ok(promptText.includes('NOT expose, quote, or mention NIVO reasoning, internal intelligence, signals, confidence values'));
    });
  });
});
