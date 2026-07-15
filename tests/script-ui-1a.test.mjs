import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Define paths to inspect
const SRC_DIR = path.join(process.cwd(), 'src');
const SIDEBAR_PATH = path.join(SRC_DIR, 'components/layout/Sidebar.jsx');
const API_SCRIPTS_PATH = path.join(SRC_DIR, 'app/api/scripts/route.js');
const IDEAS_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/ideas/page.js');
const SCRIPTS_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/scripts/page.js');
const SCRIPT_DETAIL_PAGE_PATH = path.join(SRC_DIR, 'app/dashboard/scripts/[ideaId]/page.js');

describe('SCRIPT-UI-1A WORKSPACE ARCHITECTURE REFACTOR', () => {
  it('1 & 2. Sidebar exposes /dashboard/scripts and handles active route matching for script detail routes', () => {
    const sidebar = fs.readFileSync(SIDEBAR_PATH, 'utf-8');
    assert.ok(sidebar.includes("href: '/dashboard/scripts'"), 'Sidebar must link to /dashboard/scripts');
    assert.ok(sidebar.includes("pathname.startsWith('/dashboard/scripts')"), 'Sidebar must prefix-match /dashboard/scripts routes');
  });

  it('3. Ideas page no longer renders full Script beat fields inline', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(!ideasPage.includes('beat.spokenContent'), 'Ideas page should not render spokenContent');
    assert.ok(!ideasPage.includes('beat.onScreenText'), 'Ideas page should not render onScreenText');
    assert.ok(!ideasPage.includes('beat.visualNote'), 'Ideas page should not render visualNote');
    assert.ok(!ideasPage.includes('scriptCache[idea._id].caption'), 'Ideas page should not render caption body');
  });

  it('4 & 5. Ideas page does not eagerly perform per-Idea Script GET requests; fetches scripts efficiently', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(!ideasPage.includes('fetch(`/api/scripts?ideaId=${ideaId}`)'), 'Ideas page should not map fetches per idea on load or toggle');
    assert.ok(ideasPage.includes("fetch('/api/scripts')"), 'Ideas page must fetch /api/scripts once');
    assert.ok(ideasPage.includes('scriptMap[s.sourceIdeaId] = s'), 'Ideas page must map fetched scripts by sourceIdeaId');
  });

  it('6. Generate Script from an accepted Idea navigates to /dashboard/scripts/[ideaId]', () => {
    const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
    assert.ok(ideasPage.includes('router.push(`/dashboard/scripts/${ideaId}`)'), 'Ideas page must push to script detail route on generate');
  });

  it('7 & 8 & 9. Script library page exists, separates draft and final, and does not render full beats', () => {
    const scriptsPage = fs.readFileSync(SCRIPTS_PAGE_PATH, 'utf-8');
    assert.ok(scriptsPage.includes('s.status === \'draft\''), 'Scripts page must partition drafts');
    assert.ok(scriptsPage.includes('s.status === \'final\''), 'Scripts page must partition final scripts');
    assert.ok(!scriptsPage.includes('spokenContent'), 'Scripts library should not render beat bodies');
    assert.ok(scriptsPage.includes("href={`/dashboard/scripts/${script.sourceIdeaId}`}"), 'Scripts library must link to detail workspace');
  });

  it('10, 11, 12, 13, 14, 15, 17. Script detail workspace implements required behavior', () => {
    const detailPage = fs.readFileSync(SCRIPT_DETAIL_PAGE_PATH, 'utf-8');
    
    // Loads by ideaId
    assert.ok(detailPage.includes('use(params)'), 'Detail page must use params');
    assert.ok(detailPage.includes('fetch(`/api/scripts?ideaId=${ideaId}`)'), 'Detail page must fetch script by ideaId');
    
    // Handles script: null (No script) and can generate
    assert.ok(detailPage.includes('No script exists for this idea yet.'), 'Detail page must handle empty state');
    assert.ok(detailPage.includes("fetch('/api/scripts/generate'"), 'Detail page must support generating a script');
    
    // Mutating actions are hidden from final
    assert.ok(detailPage.includes('!isFinal && ('), 'Mutating actions should be hidden for final scripts');
    
    // Vocabulary
    assert.ok(detailPage.includes('Spoken'), 'Must use SPOKEN for UI');
    assert.ok(detailPage.includes('On Screen'), 'Must use ON SCREEN for UI');
    assert.ok(detailPage.includes('Visual Direction'), 'Must use VISUAL DIRECTION for UI');
  });

  it('16. Finalization memory partial-failure reconciliation is preserved', () => {
    const detailPage = fs.readFileSync(SCRIPT_DETAIL_PAGE_PATH, 'utf-8');
    assert.ok(detailPage.includes('SCRIPT_FINALIZATION_MEMORY_ERROR'), 'Detail page must handle memory partial failure');
    assert.ok(detailPage.includes('fetchScript()'), 'Detail page must refetch script after memory error to reconcile state');
  });

  describe('SCRIPT-UI-1A.1 METADATA FAILURE ISOLATION', () => {
    it('1, 2, 3, 4, 5, 6, 7. Script fetch is isolated and cannot kill Ideas workspace', () => {
      const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
      
      // 1. Single list request remains
      assert.ok(ideasPage.includes("fetch('/api/scripts')"), 'Must use single list fetch');
      // 2. No per-Idea loop
      assert.ok(!ideasPage.includes('fetch(`/api/scripts?ideaId=${ideaId}`)'), 'Must not have per-idea script fetch');
      // 3. Isolated failure boundary
      assert.ok(ideasPage.includes('try {'), 'Must have try/catch');
      assert.ok(ideasPage.includes('const scriptsRes = await fetch(\'/api/scripts\');'), 'Script fetch must be wrapped');
      assert.ok(ideasPage.includes('catch (scriptErr)'), 'Script fetch must have inner catch');
      // 4, 5, 6. Failure sets metadata error state, not no_profile
      assert.ok(ideasPage.includes('setScriptMetadataError(true)'), 'Must set metadata error on failure');
      assert.ok(ideasPage.match(/} catch \(scriptErr\) {\s*console\.error\('Failed to load Script metadata:', scriptErr\);\s*setScriptMetadataError\(true\);\s*}/), 'Must trap json parse failures and network exceptions');
    });

    it('8, 9, 10, 11. Unknown Script metadata is not treated as definite No Script', () => {
      const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
      
      // 9. Unknown Script metadata state is not rendered as definite "No Script"
      // 10. "Generate Script" is not offered solely because scriptCache is empty
      assert.ok(ideasPage.includes('{scriptMetadataError ? ('), 'Must check metadata error before falling back to Generate Script');
      assert.ok(ideasPage.includes('SCRIPT STATUS UNAVAILABLE'), 'Must render unavailability copy');
      assert.ok(!ideasPage.match(/scriptMetadataError \? \([\s\S]*Generate Script[\s\S]*\)/), 'Must not render Generate Script when metadata is in error');
    });

    it('12, 13, 14. Duration strictly uses estimatedDurationSeconds without fallback', () => {
      const ideasPage = fs.readFileSync(IDEAS_PAGE_PATH, 'utf-8');
      const scriptsPage = fs.readFileSync(SCRIPTS_PAGE_PATH, 'utf-8');
      const detailPage = fs.readFileSync(SCRIPT_DETAIL_PAGE_PATH, 'utf-8');

      [ideasPage, scriptsPage, detailPage].forEach(page => {
        assert.ok(!page.includes('idea.estimatedDuration'), 'Must not use idea.estimatedDuration');
        assert.ok(!page.includes("'30s'"), 'Must not have 30s string literal fallback');
        assert.ok(!page.includes('"30s"'), 'Must not have 30s string literal fallback');
        assert.ok(!page.includes('|| 30'), 'Must not have 30 number fallback');
      });
      assert.ok(ideasPage.includes('estimatedDurationSeconds'), 'Ideas page must use estimatedDurationSeconds');
      assert.ok(scriptsPage.includes('estimatedDurationSeconds'), 'Scripts page must use estimatedDurationSeconds');
      assert.ok(detailPage.includes('estimatedDurationSeconds'), 'Detail page must use estimatedDurationSeconds');
    });
  });
});
