import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function runAudit() {
  console.log('=== VERIFYING CRITICAL UI COPY FIXES (Final Lock-in) ===\n');

  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch', { recursive: true });
  }

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const pageContent = await page.content();

    // 1. Check Global Subtitle
    const expectedSubtitle = 'Players ranked by estimated performance in high-leverage situations.';
    const hasExpectedSubtitle = pageContent.includes(expectedSubtitle);
    const hasOldSubtitle = pageContent.includes('High-leverage T20 decision intelligence ranking match-winners under acute match pressure');
    console.log(`[CHECK 1] Global Subtitle:`);
    console.log(`  - New copy present ('${expectedSubtitle}'): ${hasExpectedSubtitle ? 'PASS' : 'FAIL'}`);
    console.log(`  - Old copy removed: ${!hasOldSubtitle ? 'PASS' : 'FAIL'}`);

    // 2. Check Batters Podium Title
    const expectedPodiumTitle = 'The Podium: Top 3 by posterior expected rank.';
    const hasBattersPodiumTitle = pageContent.includes(expectedPodiumTitle);
    const hasOldBattersTitle = pageContent.includes('The Podium: Top 3 Pressure Match-Winners');
    console.log(`[CHECK 2A] Batters Podium Title:`);
    console.log(`  - New copy present ('${expectedPodiumTitle}'): ${hasBattersPodiumTitle ? 'PASS' : 'FAIL'}`);
    console.log(`  - Old copy removed: ${!hasOldBattersTitle ? 'PASS' : 'FAIL'}`);

    // 3. Switch to Bowlers Tab and Check Bowlers Podium Title
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(600);

    const bowlersPageContent = await page.content();
    const hasBowlersPodiumTitle = bowlersPageContent.includes(expectedPodiumTitle);
    const hasOldBowlersTitle = bowlersPageContent.includes('The Podium: Top 3 Bowling Match-Winners');
    console.log(`[CHECK 2B] Bowlers Podium Title:`);
    console.log(`  - New copy present ('${expectedPodiumTitle}'): ${hasBowlersPodiumTitle ? 'PASS' : 'FAIL'}`);
    console.log(`  - Old copy removed: ${!hasOldBowlersTitle ? 'PASS' : 'FAIL'}`);

    // 4. Check Footnote Text ('Most rating intervals include 0')
    const hasFootnoteBatters = pageContent.includes('Most rating intervals include 0');
    const hasFootnoteBowlers = bowlersPageContent.includes('Most rating intervals include 0');
    console.log(`[CHECK 3] Footnote 'Most rating intervals include 0' Removal:`);
    console.log(`  - Absent in Batters view: ${!hasFootnoteBatters ? 'PASS' : 'FAIL'}`);
    console.log(`  - Absent in Bowlers view: ${!hasFootnoteBowlers ? 'PASS' : 'FAIL'}`);

    // 5. Check 'Ask Scout' Complete Deletion
    const chatBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const askScoutBtn = btns.find(b => b.textContent.includes('Ask Scout') || b.textContent.includes('Ask AI Scout') || b.getAttribute('aria-label') === 'Ask Scout' || b.getAttribute('title') === 'Ask Scout');
      return !!askScoutBtn;
    });
    const hasAskScoutText = pageContent.includes('Ask Scout') || pageContent.includes('Ask AI Scout');
    console.log(`[CHECK 4] 'Ask Scout' Complete Deletion:`);
    console.log(`  - Floating or modal button present: ${chatBtn ? 'FAIL (found)' : 'PASS (completely absent)'}`);
    console.log(`  - Any 'Ask Scout' text in DOM: ${hasAskScoutText ? 'FAIL (found)' : 'PASS (completely absent)'}`);

    // 6. Check Player Modal (click top player on Bowlers view)
    await page.evaluate(() => {
      const card = document.querySelector('.group.cursor-pointer');
      if (card) card.click();
    });
    await page.waitForTimeout(500);
    const modalContent = await page.content();
    const modalHasAskScout = modalContent.includes('Ask AI Scout') || modalContent.includes('Ask Scout');
    const modalHasClose = modalContent.includes('Close Dossier');
    console.log(`[CHECK 5] Player Modal Check:`);
    console.log(`  - Modal 'Ask Scout' removed: ${!modalHasAskScout ? 'PASS' : 'FAIL'}`);
    console.log(`  - Modal 'Close Dossier' button present: ${modalHasClose ? 'PASS' : 'FAIL'}`);

    // Screenshots
    await page.screenshot({ path: 'scratch/copy_fixes_modal.png' });
    
    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button.absolute.top-5.right-5') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close'));
      if (closeBtn) closeBtn.click();
    });
    await page.waitForTimeout(400);

    await page.screenshot({ path: 'scratch/copy_fixes_bowlers.png' });

    // Switch back to hitters
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Batting leverage'));
      if (b) b.click();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'scratch/copy_fixes_hitters.png' });

    console.log('\n=== ALL COPY FIX VERIFICATIONS FINISHED ===');
  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
