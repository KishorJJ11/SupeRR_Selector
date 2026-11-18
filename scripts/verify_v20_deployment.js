import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI DEPLOYMENT (V20) ===\n');

  const rawJson = JSON.parse(fs.readFileSync('src/data/consensus_frontend.json', 'utf-8'));
  const expectedBattersOrder = rawJson.batters.map(b => b.name);
  const expectedBowlersOrder = rawJson.bowlers.map(b => b.name);

  console.log('Expected Batters Order from JSON (by Posterior P(Top 10)):');
  console.log(expectedBattersOrder);
  console.log('\nExpected Bowlers Order from JSON (by Posterior P(Top 10)):');
  console.log(expectedBowlersOrder);

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  let passAll = true;

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const pageContent = await page.content();

    // 1. Check Confidence Tier Legend removed
    const hasTierLegend = pageContent.includes('Confidence Tier Legend') || pageContent.includes('Tier A >= 90%');
    console.log(`\n[CHECK 1] Confidence Tier Legend removed: ${!hasTierLegend ? 'PASS' : 'FAIL'}`);
    if (hasTierLegend) passAll = false;

    // Check no Tier badges in DOM (Tier A, Tier B, Tier C as badges)
    const tierBadgeCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('span, div')).filter(el => {
        const text = el.textContent.trim();
        return (text === 'Tier A' || text === 'Tier B' || text === 'Tier C' || text === 'Low Confidence') &&
               (el.className.includes('badge') || el.className.includes('rounded'));
      }).length;
    });
    console.log(`  - Tier badges count in DOM: ${tierBadgeCount} -> ${tierBadgeCount === 0 ? 'PASS' : 'FAIL'}`);
    if (tierBadgeCount !== 0) passAll = false;

    // 2. Check "Delta vs Usual" removed from table header & cards
    const hasDeltaVsUsual = pageContent.includes('Delta vs Usual');
    console.log(`\n[CHECK 2] 'Delta vs Usual' removed: ${!hasDeltaVsUsual ? 'PASS' : 'FAIL'}`);
    if (hasDeltaVsUsual) passAll = false;

    // 3. Check "Model-fragility flag" removed and replaced by "Fit Stability %"
    const hasModelFragilityFlag = pageContent.includes('Model-fragility flag');
    console.log(`\n[CHECK 3] 'Model-fragility flag' removed: ${!hasModelFragilityFlag ? 'PASS' : 'FAIL'}`);
    if (hasModelFragilityFlag) passAll = false;

    const hasFitStability = pageContent.includes('Fit Stability %');
    console.log(`  - 'Fit Stability %' present in UI: ${hasFitStability ? 'PASS' : 'FAIL'}`);
    if (!hasFitStability) passAll = false;

    // 4. Check Dashboard Subtitle explicitly reads 'Ordered strictly by Posterior P(Top 10)'
    const expectedSubtitle = 'Ordered strictly by Posterior P(Top 10)';
    const hittersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Batting Leverage Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`\n[CHECK 4] Batters Subtitle: "${hittersSubtitle}" -> ${hittersSubtitle === expectedSubtitle ? 'PASS' : 'FAIL'}`);
    if (hittersSubtitle !== expectedSubtitle) passAll = false;

    // 5. Check Hitters sequential order matches JSON exactly (Abhishek Sharma #1, Phil Salt #2, etc.)
    const renderedBattersOrder = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.player-name').forEach(el => {
        names.push(el.textContent.trim());
      });
      return [...new Set(names)];
    });
    console.log(`\n[CHECK 5] Rendered Batters Order:`, renderedBattersOrder);
    const battersMatch = JSON.stringify(renderedBattersOrder) === JSON.stringify(expectedBattersOrder);
    console.log(`  - Batters match JSON order: ${battersMatch ? 'PASS' : 'FAIL'}`);
    if (!battersMatch) passAll = false;

    // 6. Switch to Bowlers tab and test
    const bowlerTab = await page.locator('button:has-text("Bowling surge")');
    await bowlerTab.click();
    await page.waitForTimeout(500);

    const bowlersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Bowling Surge Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`\n[CHECK 6] Bowlers Subtitle: "${bowlersSubtitle}" -> ${bowlersSubtitle === expectedSubtitle ? 'PASS' : 'FAIL'}`);
    if (bowlersSubtitle !== expectedSubtitle) passAll = false;

    const renderedBowlersOrder = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.player-name').forEach(el => {
        names.push(el.textContent.trim());
      });
      return [...new Set(names)];
    });
    console.log(`  - Rendered Bowlers Order:`, renderedBowlersOrder);
    const bowlersMatch = JSON.stringify(renderedBowlersOrder) === JSON.stringify(expectedBowlersOrder);
    console.log(`  - Bowlers match JSON order: ${bowlersMatch ? 'PASS' : 'FAIL'}`);
    if (!bowlersMatch) passAll = false;

    // 7. Check Validation Table title is 'Rolling Origin Out-of-Sample Reliability'
    const expectedValTitle = 'Rolling Origin Out-of-Sample Reliability';
    const hasValTitle = pageContent.includes(expectedValTitle);
    console.log(`\n[CHECK 7] Validation Table title '${expectedValTitle}': ${hasValTitle ? 'PASS' : 'FAIL'}`);
    if (!hasValTitle) passAll = false;

    // 8. Check Footnote text
    const expectedFootnote = 'All 20 player rating intervals include 0; they are statistically indistinguishable from the baseline average under pressure.';
    const hasFootnote = pageContent.includes(expectedFootnote);
    console.log(`\n[CHECK 8] Footnote text exact match: ${hasFootnote ? 'PASS' : 'FAIL'}`);
    if (!hasFootnote) passAll = false;

    // 9. Test Player Modal (click on first bowler)
    const firstBowlerCard = page.locator('.player-name').first();
    await firstBowlerCard.click();
    await page.waitForTimeout(500);

    const modalContent = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal ? modal.textContent : '';
    });
    const modalHasTier = modalContent.includes('Tier A') || modalContent.includes('Tier B');
    const modalHasDelta = modalContent.includes('Delta vs Usual') || modalContent.includes('Delta:');
    const modalHasFitStability = modalContent.includes('Fit Stability %');
    console.log(`\n[CHECK 9] Player Modal checks:`);
    console.log(`  - Modal has NO tier badges: ${!modalHasTier ? 'PASS' : 'FAIL'}`);
    console.log(`  - Modal has NO Delta vs Usual: ${!modalHasDelta ? 'PASS' : 'FAIL'}`);
    console.log(`  - Modal displays Fit Stability %: ${modalHasFitStability ? 'PASS' : 'FAIL'}`);
    if (modalHasTier || modalHasDelta || !modalHasFitStability) passAll = false;

    console.log(`\n==============================================`);
    console.log(`OVERALL V20 AUDIT RESULT: ${passAll ? 'ALL PASS ✅' : 'SOME CHECKS FAILED ❌'}`);
    console.log(`==============================================`);

  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
