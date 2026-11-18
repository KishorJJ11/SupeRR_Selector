import { chromium } from 'playwright';
import * as path from 'path';

async function run() {
  console.log('=== VERIFYING FINAL UI LOCK: Bag-Avg Rating & Rank ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
  await page.goto(distPath, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  let allPassed = true;

  // 1. Check Hero Primary Metric Card
  const heroPrimaryMetric = await page.textContent('body');
  const hasHeroBagAvg = heroPrimaryMetric.includes('Bag-Avg Rating (runs per 100 pressure balls vs eligible peers)');
  console.log(`[CHECK 1] Hero Section Primary Metric has 'Bag-Avg Rating': ${hasHeroBagAvg ? 'PASS' : 'FAIL'}`);
  if (!hasHeroBagAvg) allPassed = false;

  // 2. Check Hitters View Table Column Headers
  // Target specifically the leaderboard table
  const hitterHeaders = await page.$$eval('.overflow-x-auto table thead th', ths => ths.map(t => t.textContent.trim().replace(/\s+/g, ' ')));
  console.log('Hitter Table Headers:', hitterHeaders);

  const hitterHasRank = hitterHeaders.includes('Rank');
  const hitterHasNoAvgRank = !hitterHeaders.some(h => h.toLowerCase().includes('avgrank'));
  const hitterHasBagAvgRating = hitterHeaders.includes('Bag-Avg Rating');
  const hitterHasNoOldPressureHeader = !hitterHeaders.some(h => h === 'Pressure Rating');

  console.log(`[CHECK 2A] Hitters Table has 'Rank' column: ${hitterHasRank ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 2B] Hitters Table has NO 'AvgRank' column: ${hitterHasNoAvgRank ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 2C] Hitters Table has 'Bag-Avg Rating' column: ${hitterHasBagAvgRating ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 2D] Hitters Table has NO old 'Pressure Rating' header: ${hitterHasNoOldPressureHeader ? 'PASS' : 'FAIL'}`);

  if (!hitterHasRank || !hitterHasNoAvgRank || !hitterHasBagAvgRating || !hitterHasNoOldPressureHeader) allPassed = false;

  // 3. Check Hitters Podium Cards
  const hitterPodiumLabels = await page.$$eval('.bg-\\[\\#1B3FA0\\] span', spans => spans.map(s => s.textContent.trim()));
  const hitterHasPodiumBagAvg = hitterPodiumLabels.filter(t => t === 'Bag-Avg Rating').length >= 3;
  const hitterHasNoPodiumOldPressure = !hitterPodiumLabels.includes('Pressure Rating');
  console.log(`[CHECK 3A] Hitters Podium has 'Bag-Avg Rating' labels (>=3): ${hitterHasPodiumBagAvg ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 3B] Hitters Podium has NO old 'Pressure Rating' label: ${hitterHasNoPodiumOldPressure ? 'PASS' : 'FAIL'}`);
  if (!hitterHasPodiumBagAvg || !hitterHasNoPodiumOldPressure) allPassed = false;

  // 4. Switch to Bowlers View
  const bowlerTab = page.locator('button:has-text("Bowlers")');
  await bowlerTab.click();
  await page.waitForTimeout(800);

  // 5. Check Bowlers View Table Column Headers
  const bowlerHeaders = await page.$$eval('.overflow-x-auto table thead th', ths => ths.map(t => t.textContent.trim().replace(/\s+/g, ' ')));
  console.log('Bowler Table Headers:', bowlerHeaders);

  const bowlerHasRank = bowlerHeaders.includes('Rank');
  const bowlerHasNoAvgRank = !bowlerHeaders.some(h => h.toLowerCase().includes('avgrank'));
  const bowlerHasBagAvgRating = bowlerHeaders.includes('Bag-Avg Rating');
  const bowlerHasNoOldPressureHeader = !bowlerHeaders.some(h => h === 'Pressure Rating');

  console.log(`[CHECK 5A] Bowlers Table has 'Rank' column: ${bowlerHasRank ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 5B] Bowlers Table has NO 'AvgRank' column: ${bowlerHasNoAvgRank ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 5C] Bowlers Table has 'Bag-Avg Rating' column: ${bowlerHasBagAvgRating ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 5D] Bowlers Table has NO old 'Pressure Rating' header: ${bowlerHasNoOldPressureHeader ? 'PASS' : 'FAIL'}`);

  if (!bowlerHasRank || !bowlerHasNoAvgRank || !bowlerHasBagAvgRating || !bowlerHasNoOldPressureHeader) allPassed = false;

  // 6. Check Bowlers Podium Cards
  const bowlerPodiumLabels = await page.$$eval('.bg-\\[\\#1B3FA0\\] span', spans => spans.map(s => s.textContent.trim()));
  const bowlerHasPodiumBagAvg = bowlerPodiumLabels.filter(t => t === 'Bag-Avg Rating').length >= 3;
  const bowlerHasNoPodiumOldPressure = !bowlerPodiumLabels.includes('Pressure Rating');
  console.log(`[CHECK 6A] Bowlers Podium has 'Bag-Avg Rating' labels (>=3): ${bowlerHasPodiumBagAvg ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 6B] Bowlers Podium has NO old 'Pressure Rating' label: ${bowlerHasNoPodiumOldPressure ? 'PASS' : 'FAIL'}`);
  if (!bowlerHasPodiumBagAvg || !bowlerHasNoPodiumOldPressure) allPassed = false;

  // 7. Check Player Modal by clicking a player row in the leaderboard table
  const playerRow = page.locator('tbody tr.cursor-pointer').first();
  await playerRow.click();
  await page.waitForSelector('.fixed.inset-0', { timeout: 5000 });

  const modalText = await page.textContent('.fixed.inset-0');
  const modalHasBagAvg = modalText.includes('Bag-Avg Rating:');
  const modalHasNoOldPressure = !modalText.includes('Pressure Rating:');
  console.log(`[CHECK 7A] Player Modal displays 'Bag-Avg Rating:': ${modalHasBagAvg ? 'PASS' : 'FAIL'}`);
  console.log(`[CHECK 7B] Player Modal has NO old 'Pressure Rating:': ${modalHasNoOldPressure ? 'PASS' : 'FAIL'}`);
  if (!modalHasBagAvg || !modalHasNoOldPressure) allPassed = false;

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 8. Check Delta Hover Tooltip
  const deltaTh = page.locator('th:has-text("Delta vs Usual")').first();
  const deltaTitle = await deltaTh.getAttribute('title');
  const deltaTooltipCorrect = deltaTitle === 'Pressure rating minus ordinary (non-pressure) rating.';
  console.log(`[CHECK 8] Delta hover definition strictly preserved: ${deltaTooltipCorrect ? 'PASS' : 'FAIL'} ("${deltaTitle}")`);
  if (!deltaTooltipCorrect) allPassed = false;

  // Take screenshot
  await page.screenshot({ path: 'scratch/bag_avg_rating_verification.png', fullPage: true });
  console.log('\nScreenshot saved to scratch/bag_avg_rating_verification.png');

  await browser.close();

  if (allPassed) {
    console.log('\n=== ALL BAG-AVG RATING LOCK AUDIT CHECKS PASSED ===');
    process.exit(0);
  } else {
    console.error('\n=== AUDIT CHECKS FAILED ===');
    process.exit(1);
  }
}

run();
