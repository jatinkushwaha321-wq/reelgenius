import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');
const PROFILE_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/profile/page.js');

describe('PROFILE-UI-1B: STRUCTURED INTELLIGENCE PRESENTATION', () => {
  it('A, B, C. Tone Profile renders source array items through iteration', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(!profilePage.includes('brandIdentity.tone.join'), 'Tone Profile must not use join(",")');
    assert.ok(profilePage.includes('brandIdentity.tone.map'), 'Tone Profile must iterate array items with map()');
    assert.ok(profilePage.includes('{t}'), 'Tone Profile must render exact values directly');
  });

  it('D, E, F. Observed Core Values renders source array items through iteration and preserves label', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(!profilePage.includes('brandIdentity.values.join'), 'Observed Core Values must not use join(",")');
    assert.ok(profilePage.includes('brandIdentity.values.map'), 'Observed Core Values must iterate array items with map()');
    assert.ok(profilePage.includes('OBSERVED CORE VALUES') || profilePage.includes('Observed Core Values'), 'Exact label OBSERVED CORE VALUES must be present');
  });

  it('G, H. Inferred Interests and Potential Pain Points preserve exact epistemic labels', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(profilePage.includes('Inferred Interests'), 'Exact label Inferred Interests must be present');
    assert.ok(profilePage.includes('Potential Pain Points'), 'Exact label Potential Pain Points must be present');
  });

  it('I, J. Status copy is updated to "Creator Intelligence Active"', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(profilePage.includes('Creator Intelligence Active'), 'Must render "Creator Intelligence Active"');
    assert.ok(!profilePage.includes('Intelligence Synthesis Active'), 'Must NOT render "Intelligence Synthesis Active"');
  });

  it('K. RE-DERIVE INTELLIGENCE button action copy is preserved', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(profilePage.includes('Re-derive Intelligence'), 'Button must retain Re-derive Intelligence action wording');
  });

  it('L, M, N. Posting Frequency is directly rendered without regex or structured extraction labels', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(profilePage.includes('{profile.postingFrequency}'), 'Posting cadence must render exact string');
    assert.ok(!profilePage.match(/median|mean|weekdays?/i), 'Must not introduce hardcoded cadence metric labels');
  });
});
