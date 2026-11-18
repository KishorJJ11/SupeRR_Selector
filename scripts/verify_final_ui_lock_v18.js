import { chromium } from 'playwright';
import * as path from 'path';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI LOCK: Subtitle, Pressure Rating & Footnote ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    let allPassed = true;

    // 1. Check Hero Section Expected Rank KPI card
    const heroKpiText = await page.$eval('.grid.grid-cols-2.sm\\:grid-cols-4', el => el.textContent);
    const hasHeroSubtitle = heroKpiText.includes('Ordered by P(Top 10), then Expected Rank');
    console.log(`[CHECK 1] Hero Expected Rank card has 'Ordered by P(Top 10), then Expected Rank': ${hasHeroSubtitle ? 'PASS' : 'FAIL'}`);
    if (!hasHeroSubtitle) allPassed = false;

    // 2. Check Hitters View Subtitle
    const hittersSubtitle = await page.$eval('main p.text-slate-600', el => el.textContent.trim());
    const hittersSubtitlePassed = hittersSubtitle === 'Ordered by P(Top 10), then Expected Rank';
    console.log(`[CHECK 2] Hitters Subtitle strictly matches: ${hittersSubtitlePassed ? 'PASS' : 'FAIL'} ("${hittersSubtitle}")`);
    if (!hittersSubtitlePassed) allPassed = false;

    // 3. Check Hitters Table Column Header
    const hitterHeaders = await page.$$eval('.overflow-x-auto table thead th', ths => ths.map(t => t.textContent.trim().replace(/\s+/g, ' ')));
    const hitterPressureHeaderPassed = hitterHeaders.includes('Pressure Rating');
    const hitterNoBagAvgPassed = !hitterHeaders.includes('Bag-Avg Rating');
    console.log(`[CHECK 3A] Hitters Table has 'Pressure Rating' header: ${hitterPressureHeaderPassed ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 3B] Hitters Table has NO 'Bag-Avg Rating' header: ${hitterNoBagAvgPassed ? 'PASS' : 'FAIL'}`);
    if (!hitterPressureHeaderPassed || !hitterNoBagAvgPassed) allPassed = false;

    // 4. Check Hitters Podium Card Labels
    const hitterPodiumLabels = await page.$$eval('.bg-\\[\\#1B3FA0\\] span', spans => spans.map(s => s.textContent.trim()));
    const hitterPodiumPressurePassed = hitterPodiumLabels.filter(t => t === 'Pressure Rating').length >= 3;
    const hitterPodiumNoBagAvgPassed = !hitterPodiumLabels.includes('Bag-Avg Rating');
    console.log(`[CHECK 4A] Hitters Podium has 'Pressure Rating' labels (>=3): ${hitterPodiumPressurePassed ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 4B] Hitters Podium has NO 'Bag-Avg Rating' label: ${hitterPodiumNoBagAvgPassed ? 'PASS' : 'FAIL'}`);
    if (!hitterPodiumPressurePassed || !hitterPodiumNoBagAvgPassed) allPassed = false;

    // 5. Check Hitters Footnote
    const expectedFootnote = 'All 20 player rating intervals include 0; they are statistically indistinguishable from the baseline average under pressure.';
    const hittersFootnote = await page.$eval('main p.italic', el => el.textContent.trim());
    const hittersFootnotePassed = hittersFootnote === expectedFootnote;
    console.log(`[CHECK 5] Hitters Footnote strictly matches: ${hittersFootnotePassed ? 'PASS' : 'FAIL'} ("${hittersFootnote}")`);
    if (!hittersFootnotePassed) allPassed = false;

    // 6. Switch to Bowlers View
    const bowlerTab = page.locator('button:has-text("Bowlers")');
    await bowlerTab.click();
    await page.waitForTimeout(800);

    // 7. Check Bowlers View Subtitle
    const bowlersSubtitle = await page.$eval('main p.text-slate-600', el => el.textContent.trim());
    const bowlersSubtitlePassed = bowlersSubtitle === 'Ordered by P(Top 10), then Expected Rank';
    console.log(`[CHECK 6] Bowlers Subtitle strictly matches: ${bowlersSubtitlePassed ? 'PASS' : 'FAIL'} ("${bowlersSubtitle}")`);
    if (!bowlersSubtitlePassed) allPassed = false;

    // 8. Check Bowlers Table Column Header
    const bowlerHeaders = await page.$$eval('.overflow-x-auto table thead th', ths => ths.map(t => t.textContent.trim().replace(/\s+/g, ' ')));
    const bowlerPressureHeaderPassed = bowlerHeaders.includes('Pressure Rating');
    const bowlerNoBagAvgPassed = !bowlerHeaders.includes('Bag-Avg Rating');
    console.log(`[CHECK 7A] Bowlers Table has 'Pressure Rating' header: ${bowlerPressureHeaderPassed ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 7B] Bowlers Table has NO 'Bag-Avg Rating' header: ${bowlerNoBagAvgPassed ? 'PASS' : 'FAIL'}`);
    if (!bowlerPressureHeaderPassed || !bowlerNoBagAvgPassed) allPassed = false;

    // 9. Check Bowlers Podium Card Labels
    const bowlerPodiumLabels = await page.$$eval('.bg-\\[\\#1B3FA0\\] span', spans => spans.map(s => s.textContent.trim()));
    const bowlerPodiumPressurePassed = bowlerPodiumLabels.filter(t => t === 'Pressure Rating').length >= 3;
    const bowlerPodiumNoBagAvgPassed = !bowlerPodiumLabels.includes('Bag-Avg Rating');
    console.log(`[CHECK 8A] Bowlers Podium has 'Pressure Rating' labels (>=3): ${bowlerPodiumPressurePassed ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 8B] Bowlers Podium has NO 'Bag-Avg Rating' label: ${bowlerPodiumNoBagAvgPassed ? 'PASS' : 'FAIL'}`);
    if (!bowlerPodiumPressurePassed || !bowlerPodiumNoBagAvgPassed) allPassed = false;

    // 10. Check Bowlers Footnote
    const bowlersFootnote = await page.$eval('main p.italic', el => el.textContent.trim());
    const bowlersFootnotePassed = bowlersFootnote === expectedFootnote;
    console.log(`[CHECK 9] Bowlers Footnote strictly matches: ${bowlersFootnotePassed ? 'PASS' : 'FAIL'} ("${bowlersFootnote}")`);
    if (!bowlersFootnotePassed) allPassed = false;

    // 11. Check Player Modal
    const playerRow = page.locator('tbody tr.cursor-pointer').first();
    await playerRow.click();
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });

    const modalText = await page.textContent('.fixed.inset-0');
    const modalPressurePassed = modalText.includes('Pressure Rating:');
    const modalNoBagAvgPassed = !modalText.includes('Bag-Avg Rating:');
    console.log(`[CHECK 10A] Player Modal displays 'Pressure Rating:': ${modalPressurePassed ? 'PASS' : 'FAIL'}`);
    console.log(`[CHECK 10B] Player Modal has NO 'Bag-Avg Rating:': ${modalNoBagAvgPassed ? 'PASS' : 'FAIL'}`);
    if (!modalPressurePassed || !modalNoBagAvgPassed) allPassed = false;

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Screenshot
    await page.screenshot({ path: 'scratch/final_lock_v18_verification.png', fullPage: true });
    console.log('\nScreenshot saved to scratch/final_lock_v18_verification.png');

    await browser.close();

    if (allPassed) {
      console.log('\n=== ALL FINAL UI LOCK V18 AUDIT CHECKS PASSED ===');
      process.exit(0);
    } else {
      console.error('\n=== AUDIT CHECKS FAILED ===');
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit error:', err);
    await browser.close();
    process.exit(1);
  }
}

runAudit();
