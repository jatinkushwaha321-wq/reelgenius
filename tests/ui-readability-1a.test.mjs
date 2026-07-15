import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.join(process.cwd(), 'src');
const IDEAS_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/ideas/page.js');
const SCRIPTS_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/scripts/page.js');
const SCRIPT_DETAIL_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/scripts/[ideaId]/page.js');
const PROFILE_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/profile/page.js');

describe('UI-READABILITY-1A: TYPOGRAPHY, READABILITY AND HIERARCHY', () => {
  it('1. Ideas workspace still renders the exact "Your Ideas" terminology', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(ideasPage.includes('Your Ideas'), 'Ideas workspace must retain "Your Ideas" terminology');
  });

  it('2. Ideas workspace does not reintroduce inline Script beat rendering', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(!ideasPage.includes('beat.spokenContent'), 'Ideas page should not render spokenContent');
    assert.ok(!ideasPage.includes('beat.onScreenText'), 'Ideas page should not render onScreenText');
    assert.ok(!ideasPage.includes('beat.visualNote'), 'Ideas page should not render visualNote');
  });

  it('3 & 4. Ideas duration remains Script-derived from estimatedDurationSeconds, does not consume idea.estimatedDuration', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(ideasPage.includes('estimatedDurationSeconds'), 'Ideas duration must come from estimatedDurationSeconds');
    assert.ok(!ideasPage.includes('idea.estimatedDuration'), 'Ideas duration must NOT use idea.estimatedDuration');
  });

  it('5 & 6. Script Library groups draft and final Scripts and does not render full beats', () => {
    const scriptsPage = fs.readFileSync(SCRIPTS_PAGE_PATH, 'utf-8');
    assert.ok(scriptsPage.includes('status === \'draft\''), 'Scripts Library must group drafts');
    assert.ok(scriptsPage.includes('status === \'final\''), 'Scripts Library must group final scripts');
    assert.ok(!scriptsPage.includes('spokenContent'), 'Scripts library should not render beat bodies');
  });

  it('7, 8, 9, 10, 11, 12. Dedicated Script workspace preserves UI vocabulary for beats and hides schema vocabulary', () => {
    const detailPage = fs.readFileSync(SCRIPT_DETAIL_PAGE_PATH, 'utf-8');
    assert.ok(detailPage.includes('>Spoken</span>'), 'Detail page must use SPOKEN for UI');
    assert.ok(detailPage.includes('>On Screen</span>'), 'Detail page must use ON SCREEN for UI');
    assert.ok(detailPage.includes('>Visual Direction</span>'), 'Detail page must use VISUAL DIRECTION for UI');
    
    assert.ok(!detailPage.includes('>spokenContent</span>'), 'Must not expose spokenContent as rendered UI vocabulary');
    assert.ok(!detailPage.includes('>onScreenText</span>'), 'Must not expose onScreenText as rendered UI vocabulary');
    assert.ok(!detailPage.includes('>visualNote</span>'), 'Must not expose visualNote as rendered UI vocabulary');
  });

  it('13, 14. Profile intelligence wording preserves observed/inferred/potential semantics and backend is untouched', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(profilePage.includes('Observed Core Values'), 'Must preserve observed core values wording');
    assert.ok(profilePage.includes('Inferred Interests'), 'Must preserve inferred interests wording');
    assert.ok(profilePage.includes('Potential Pain Points'), 'Must preserve potential pain points wording');
    
    // Check backend untouched assumption (API routes still intact)
    assert.ok(profilePage.includes("fetch('/api/profile'"), 'Must retain profile GET endpoint');
    assert.ok(profilePage.includes("fetch('/api/observe'"), 'Must retain observe POST endpoint');
    assert.ok(profilePage.includes("fetch('/api/intelligence/analyze'"), 'Must retain intelligence analyze endpoint');
  });
  
  it('Primary Content is no longer aggressively tiny', () => {
    const profilePage = fs.readFileSync(PROFILE_PAGE_PATH, 'utf-8');
    assert.ok(!profilePage.includes('text-[12px] leading-relaxed text-white/75 mt-0.5'), 'Aggressively tiny primary content in profile should be updated');
    assert.ok(profilePage.includes('text-[15px] leading-[1.65] text-white/80'), 'Primary content in profile should be updated to larger text');
  });
});
