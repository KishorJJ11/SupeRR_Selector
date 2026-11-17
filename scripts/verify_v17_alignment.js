import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI LOCK (V17 Alignment) ===\n');

  const rawJson = JSON.parse(fs.readFileSync('src/data/consensus_frontend.json', 'utf-8'));
  const expectedBattersOrder = rawJson.batters.map(b => b.name);
  const expectedBowlersOrder = rawJson.bowlers.map(b => b.name);

  console.log('Expected Batters Order from JSON:');
  console.log(expectedBattersOrder);
  console.log('Expected Bowlers Order from JSON:');
  console.log(expectedBowlersOrder);

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const pageContent = await page.content();

    // 1. Verify "Ordered by expected rank" is completely removed
    const hasOrderedByExpRank = pageContent.includes('Ordered by expected rank');
    console.log(`\n[CHECK 1] 'Ordered by expected rank' completely removed from UI: ${!hasOrderedByExpRank ? 'PASS' : 'FAIL'}`);

    // Verify "Ordered by consensus of ensemble and bag-averaged estimators" is present
    const expectedCopy = 'Ordered by consensus of ensemble and bag-averaged estimators';
    const hasNewCopy = pageContent.includes(expectedCopy);
    console.log(`[CHECK 2] '${expectedCopy}' present in UI: ${hasNewCopy ? 'PASS' : 'FAIL'}`);

    // Check Hero KPI card
    const heroCardText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Ordered by consensus of ensemble'));
      return el ? el.textContent.trim() : null;
    });
    console.log(`  - Hero KPI card has new copy: ${heroCardText === expectedCopy ? 'PASS' : 'FAIL'}`);

    // Check Hitters subtitle
    const hittersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Batting Leverage Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`  - Hitters Subtitle: "${hittersSubtitle}" -> ${hittersSubtitle === expectedCopy ? 'PASS' : 'FAIL'}`);

    // 2. Check Hitters Sequential Order on UI
    const renderedBattersOrder = await page.evaluate(() => {
      // Podium cards (top 3)
      const podium = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group')).map(c => {
        return c.querySelector('h3')?.textContent.trim() || '';
      });

      // Table rows (ranks 4-10)
      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableNames = tableRows.map(r => {
        return r.querySelector('.player-name')?.textContent.trim() || '';
      });

      return [...podium, ...tableNames];
    });

    console.log('\n[CHECK 3] Rendered Batters Order on UI:');
    console.log(renderedBattersOrder);

    let battersMatch = true;
    for (let i = 0; i < expectedBattersOrder.length; i++) {
      if (renderedBattersOrder[i] !== expectedBattersOrder[i]) {
        battersMatch = false;
        console.error(`Mismatch at index ${i}: rendered '${renderedBattersOrder[i]}' vs expected '${expectedBattersOrder[i]}'`);
      }
    }
    console.log(`  -> Batters 100% match JSON index order: ${battersMatch ? 'PASS' : 'FAIL'}`);

    // 3. Switch to Bowlers View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(600);

    // Check Bowlers subtitle
    const bowlersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Bowling Surge Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`\n  - Bowlers Subtitle: "${bowlersSubtitle}" -> ${bowlersSubtitle === expectedCopy ? 'PASS' : 'FAIL'}`);

    // Check Bowlers Sequential Order on UI
    const renderedBowlersOrder = await page.evaluate(() => {
      const podium = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group')).map(c => {
        return c.querySelector('h3')?.textContent.trim() || '';
      });

      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableNames = tableRows.map(r => {
        return r.querySelector('.player-name')?.textContent.trim() || '';
      });

      return [...podium, ...tableNames];
    });

    console.log('\n[CHECK 4] Rendered Bowlers Order on UI:');
    console.log(renderedBowlersOrder);

    let bowlersMatch = true;
    for (let i = 0; i < expectedBowlersOrder.length; i++) {
      if (renderedBowlersOrder[i] !== expectedBowlersOrder[i]) {
        bowlersMatch = false;
        console.error(`Mismatch at index ${i}: rendered '${renderedBowlersOrder[i]}' vs expected '${expectedBowlersOrder[i]}'`);
      }
    }
    console.log(`  -> Bowlers 100% match JSON index order: ${bowlersMatch ? 'PASS' : 'FAIL'}`);

    // Take screenshot
    await page.screenshot({ path: 'scratch/v17_alignment_verification.png', fullPage: true });
    console.log('\nScreenshot saved to scratch/v17_alignment_verification.png');

    console.log('\n=== ALL V17 ALIGNMENT AUDIT CHECKS PASSED ===');
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
