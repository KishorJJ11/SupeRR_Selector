import { chromium } from 'playwright';
import * as path from 'path';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI LOCK (V15 Update) ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // 1. Check Subtitle on Hitters View
    const hittersSubtitle = await page.evaluate(() => {
      // Find the subtitle under "Batting Leverage Dossier"
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Batting Leverage Dossier'));
      const p = h2 ? h2.parentElement?.querySelector('p') : null;
      return p ? p.textContent.trim() : '';
    });
    console.log(`[CHECK 1A] Hitters Dashboard Subtitle: "${hittersSubtitle}"`);
    const passHittersSub = hittersSubtitle === 'Ordered by Ensemble Pressure Rating.';
    console.log(`  -> ${passHittersSub ? 'PASS' : 'FAIL'}`);

    // 2. Check Hitters Ratings vs Rank order numerically
    const hittersRankRating = await page.evaluate(() => {
      const podiumCards = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group'));
      const podium = podiumCards.map(c => {
        const rankSpan = c.querySelector('.font-display.font-black.text-xl');
        const rankText = rankSpan ? rankSpan.textContent.trim() : '';
        const name = c.querySelector('h3')?.textContent.trim() || '';
        const ratingSpan = c.querySelector('.text-2xl.font-display.tabular-nums');
        const ratingText = ratingSpan ? ratingSpan.textContent.trim() : '';
        return {
          rank: parseInt(rankText.replace(/\D/g, ''), 10),
          name,
          rating: parseFloat(ratingText.replace('+', ''))
        };
      });

      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const tds = Array.from(r.querySelectorAll('td'));
        const rank = parseInt(tds[0]?.textContent.trim().replace(/\D/g, ''), 10);
        const name = tds[1]?.querySelector('.player-name')?.textContent.trim() || '';
        const ratingText = tds[2]?.querySelector('span')?.textContent.trim() || '';
        return {
          rank,
          name,
          rating: parseFloat(ratingText.replace('+', ''))
        };
      });

      return [...podium, ...tableData];
    });

    console.log('\n[CHECK 2A] Hitters Ranks & Pressure Ratings:');
    console.table(hittersRankRating);

    let hittersMonotonic = true;
    for (let i = 0; i < hittersRankRating.length - 1; i++) {
      if (hittersRankRating[i].rating < hittersRankRating[i + 1].rating) {
        hittersMonotonic = false;
        console.error(`FAIL: Rank ${hittersRankRating[i].rank} (${hittersRankRating[i].rating}) < Rank ${hittersRankRating[i+1].rank} (${hittersRankRating[i+1].rating})`);
      }
    }
    console.log(`  -> Batters ratings match Rank order numerically: ${hittersMonotonic ? 'PASS' : 'FAIL'}`);

    // 3. Switch to Bowlers View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(600);

    // Check Subtitle on Bowlers View
    const bowlersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Bowling Surge Dossier'));
      const p = h2 ? h2.parentElement?.querySelector('p') : null;
      return p ? p.textContent.trim() : '';
    });
    console.log(`\n[CHECK 1B] Bowlers Dashboard Subtitle: "${bowlersSubtitle}"`);
    const passBowlersSub = bowlersSubtitle === 'Ordered by Ensemble Pressure Rating.';
    console.log(`  -> ${passBowlersSub ? 'PASS' : 'FAIL'}`);

    // 4. Check Bowlers Ratings vs Rank order numerically
    const bowlersRankRating = await page.evaluate(() => {
      const podiumCards = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group'));
      const podium = podiumCards.map(c => {
        const rankSpan = c.querySelector('.font-display.font-black.text-xl');
        const rankText = rankSpan ? rankSpan.textContent.trim() : '';
        const name = c.querySelector('h3')?.textContent.trim() || '';
        const ratingSpan = c.querySelector('.text-2xl.font-display.tabular-nums');
        const ratingText = ratingSpan ? ratingSpan.textContent.trim() : '';
        return {
          rank: parseInt(rankText.replace(/\D/g, ''), 10),
          name,
          rating: parseFloat(ratingText.replace('+', ''))
        };
      });

      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const tds = Array.from(r.querySelectorAll('td'));
        const rank = parseInt(tds[0]?.textContent.trim().replace(/\D/g, ''), 10);
        const name = tds[1]?.querySelector('.player-name')?.textContent.trim() || '';
        const ratingText = tds[2]?.querySelector('span')?.textContent.trim() || '';
        return {
          rank,
          name,
          rating: parseFloat(ratingText.replace('+', ''))
        };
      });

      return [...podium, ...tableData];
    });

    console.log('\n[CHECK 2B] Bowlers Ranks & Pressure Ratings:');
    console.table(bowlersRankRating);

    let bowlersMonotonic = true;
    for (let i = 0; i < bowlersRankRating.length - 1; i++) {
      if (bowlersRankRating[i].rating < bowlersRankRating[i + 1].rating) {
        bowlersMonotonic = false;
        console.error(`FAIL: Rank ${bowlersRankRating[i].rank} (${bowlersRankRating[i].rating}) < Rank ${bowlersRankRating[i+1].rank} (${bowlersRankRating[i+1].rating})`);
      }
    }
    console.log(`  -> Bowlers ratings match Rank order numerically: ${bowlersMonotonic ? 'PASS' : 'FAIL'}`);

    // 5. Check Validation Panel Table Columns & Metadata
    const validationInfo = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('Out-of-Sample Predictive Validation'));
      const container = h3 ? h3.closest('.rounded-2xl') : null;
      if (!container) return null;
      const table = container.querySelector('table');
      if (!table) return null;
      const ths = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(r => {
        const cells = Array.from(r.querySelectorAll('td')).map(td => td.textContent.trim());
        return {
          role: cells[0],
          rhoPressure: cells[1],
          rhoOrdinary: cells[2],
          hitRate: cells[3],
          validN: cells[4],
          expectedHits: cells[5],
          status: cells[6]
        };
      });
      return { ths, rows };
    });

    console.log('\n[CHECK 3] Validation Table Headers:');
    console.log(validationInfo.ths);
    console.log('[CHECK 3] Validation Table Rows:');
    console.table(validationInfo.rows);

    const hasSpearmanHeaders = validationInfo.ths.some(th => th.includes('OOS Spearman ρ'));
    console.log(`  -> Headers contain 'OOS Spearman ρ': ${hasSpearmanHeaders ? 'PASS' : 'FAIL'}`);

    // Verify row values match meta.validation directly
    const batRow = validationInfo.rows.find(r => r.role === 'Batters');
    const bowRow = validationInfo.rows.find(r => r.role === 'Bowlers');
    console.log(`  -> Batters Rho Pressure (0.01): ${batRow.rhoPressure === '0.01' ? 'PASS' : `FAIL (${batRow.rhoPressure})`}`);
    console.log(`  -> Batters Rho Ordinary (-0.04): ${batRow.rhoOrdinary === '-0.04' ? 'PASS' : `FAIL (${batRow.rhoOrdinary})`}`);
    console.log(`  -> Bowlers Rho Pressure (0.27): ${bowRow.rhoPressure === '0.27' ? 'PASS' : `FAIL (${bowRow.rhoPressure})`}`);
    console.log(`  -> Bowlers Rho Ordinary (0.36): ${bowRow.rhoOrdinary === '0.36' ? 'PASS' : `FAIL (${bowRow.rhoOrdinary})`}`);
    console.log(`  -> Batters Hit Rate (44%): ${batRow.hitRate === '44%' ? 'PASS' : `FAIL (${batRow.hitRate})`}`);
    console.log(`  -> Bowlers Hit Rate (60%): ${bowRow.hitRate === '60%' ? 'PASS' : `FAIL (${bowRow.hitRate})`}`);
    console.log(`  -> Batters Expected Hits (4.8/10): ${batRow.expectedHits === '4.8/10' ? 'PASS' : `FAIL (${batRow.expectedHits})`}`);
    console.log(`  -> Bowlers Expected Hits (3.9/10): ${bowRow.expectedHits === '3.9/10' ? 'PASS' : `FAIL (${bowRow.expectedHits})`}`);

    // Take screenshot
    await page.screenshot({ path: 'scratch/v15_lock_verification.png', fullPage: true });
    console.log('\nFull page screenshot saved to scratch/v15_lock_verification.png');

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
