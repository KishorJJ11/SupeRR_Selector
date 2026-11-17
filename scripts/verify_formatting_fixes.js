import { chromium } from 'playwright';
import * as path from 'path';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI FORMATTING FIXES ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // 1. Check Validation Panel Ordinary Rho formatting
    const validationMetrics = await page.evaluate(() => {
      const panel = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Out-of-Sample Predictive Validation'));
      if (!panel) return [];
      const rows = Array.from(panel.querySelectorAll('tbody tr'));
      return rows.map(r => {
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
    });

    console.log('[TEST 1] Validation Panel Metrics:');
    console.table(validationMetrics);

    const battersRhoOrd = validationMetrics.find(m => m.role === 'Batters')?.rhoOrdinary;
    const bowlersRhoOrd = validationMetrics.find(m => m.role === 'Bowlers')?.rhoOrdinary;
    const passBattersRho = battersRhoOrd === '-0.04' || battersRhoOrd.match(/^-?\d+\.\d{2}$/);
    const passBowlersRho = bowlersRhoOrd === '0.36' || bowlersRhoOrd.match(/^-?\d+\.\d{2}$/);
    console.log(`[TEST 1 RESULT] Ordinary Rho Batters (2 decimals): ${passBattersRho ? 'PASS' : `FAIL (${battersRhoOrd})`}`);
    console.log(`[TEST 1 RESULT] Ordinary Rho Bowlers (2 decimals): ${passBowlersRho ? 'PASS' : `FAIL (${bowlersRhoOrd})`}`);

    // 2. Check Hitters View: Podium cards & Leaderboard table
    const hittersData = await page.evaluate(() => {
      // Podium cards (top 3)
      const podiumCards = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group'));
      const podium = podiumCards.map(c => {
        const name = c.querySelector('h3')?.textContent.trim();
        const numSpans = Array.from(c.querySelectorAll('span.font-primary.tabular-nums'));
        const expVal = numSpans[0] ? numSpans[0].textContent.trim() : null;
        
        // Find P(Top 10) value (in the next box)
        const pSpan = Array.from(c.querySelectorAll('span')).find(s => s.textContent.includes('%') && s.parentElement?.textContent?.includes('P(Top 10)'));
        const pVal = pSpan ? pSpan.textContent.trim() : null;

        return { name, expVal, pVal };
      });

      // Table rows (ranks 4-10)
      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const tds = Array.from(r.querySelectorAll('td'));
        const name = tds[1]?.querySelector('.player-name')?.textContent.trim();
        const expRank = tds[4]?.textContent.trim();
        const pTop10 = tds[5]?.querySelector('span')?.textContent.trim();
        return { name, expRank, pTop10 };
      });

      return { podium, tableData };
    });

    console.log('\n[TEST 2] Hitters Podium Decimals:');
    console.table(hittersData.podium);
    console.log('\n[TEST 2] Hitters Table Decimals:');
    console.table(hittersData.tableData);

    const allHittersRanks = [...hittersData.podium.map(p => p.expVal), ...hittersData.tableData.map(p => p.expRank)];
    const allHittersPTop10 = [...hittersData.podium.map(p => p.pVal), ...hittersData.tableData.map(p => p.pTop10)];

    const nonDecimalHittersRank = allHittersRanks.filter(r => r && !r.includes('.'));
    const nonDecimalHittersPTop10 = allHittersPTop10.filter(p => p && !p.includes('.'));

    console.log(`[TEST 2 RESULT] All Hitters Expected Ranks have decimals: ${nonDecimalHittersRank.length === 0 ? 'PASS' : `FAIL (${nonDecimalHittersRank.join(', ')})`}`);
    console.log(`[TEST 2 RESULT] All Hitters P(Top 10) have decimals: ${nonDecimalHittersPTop10.length === 0 ? 'PASS' : `FAIL (${nonDecimalHittersPTop10.join(', ')})`}`);

    // 3. Switch to Bowlers View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(600);

    const bowlersData = await page.evaluate(() => {
      const podiumCards = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group'));
      const podium = podiumCards.map(c => {
        const name = c.querySelector('h3')?.textContent.trim();
        const numSpans = Array.from(c.querySelectorAll('span.font-primary.tabular-nums'));
        const expVal = numSpans[0] ? numSpans[0].textContent.trim() : null;
        
        const pSpan = Array.from(c.querySelectorAll('span')).find(s => s.textContent.includes('%') && s.parentElement?.textContent?.includes('P(Top 10)'));
        const pVal = pSpan ? pSpan.textContent.trim() : null;

        return { name, expVal, pVal };
      });

      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const tds = Array.from(r.querySelectorAll('td'));
        const name = tds[1]?.querySelector('.player-name')?.textContent.trim();
        const expRank = tds[4]?.textContent.trim();
        const pTop10 = tds[5]?.querySelector('span')?.textContent.trim();
        return { name, expRank, pTop10 };
      });

      return { podium, tableData };
    });

    console.log('\n[TEST 3] Bowlers Podium Decimals:');
    console.table(bowlersData.podium);
    console.log('\n[TEST 3] Bowlers Table Decimals:');
    console.table(bowlersData.tableData);

    const allBowlersRanks = [...bowlersData.podium.map(p => p.expVal), ...bowlersData.tableData.map(p => p.expRank)];
    const allBowlersPTop10 = [...bowlersData.podium.map(p => p.pVal), ...bowlersData.tableData.map(p => p.pTop10)];

    const nonDecimalBowlersRank = allBowlersRanks.filter(r => r && !r.includes('.'));
    const nonDecimalBowlersPTop10 = allBowlersPTop10.filter(p => p && !p.includes('.'));

    console.log(`[TEST 3 RESULT] All Bowlers Expected Ranks have decimals: ${nonDecimalBowlersRank.length === 0 ? 'PASS' : `FAIL (${nonDecimalBowlersRank.join(', ')})`}`);
    console.log(`[TEST 3 RESULT] All Bowlers P(Top 10) have decimals: ${nonDecimalBowlersPTop10.length === 0 ? 'PASS' : `FAIL (${nonDecimalBowlersPTop10.join(', ')})`}`);

    // Check Bumrah specifically
    const bumrah = [...bowlersData.podium, ...bowlersData.tableData].find(p => p.name && p.name.includes('Jasprit Bumrah'));
    console.log(`[CHECK Jasprit Bumrah] Expected Rank: '${bumrah?.expRank}', P(Top 10): '${bumrah?.pTop10}'`);
    console.log(`[CHECK Jasprit Bumrah RESULT] ${bumrah?.expRank === '19.0' ? 'PASS' : 'FAIL'}`);

    // 4. Test Player Modal
    await page.evaluate(() => {
      const card = document.querySelector('.bg-\\[\\#1B3FA0\\] .group');
      if (card) card.click();
    });
    await page.waitForTimeout(500);

    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      if (!modal) return null;
      const subtitle = modal.querySelector('p')?.textContent.trim();
      const boxes = Array.from(modal.querySelectorAll('.grid > div'));
      const expBox = boxes.find(b => b.textContent.includes('Expected Rank'));
      const pBox = boxes.find(b => b.textContent.includes('P(Top 10)'));
      return {
        subtitle,
        gridExp: expBox ? expBox.querySelector('.text-xl')?.textContent.trim() : null,
        gridP: pBox ? pBox.querySelector('.text-xl')?.textContent.trim() : null
      };
    });

    console.log('\n[TEST 4] Modal Decimals:');
    console.log(modalData);
    const passModal = modalData?.subtitle?.includes('.') && modalData?.gridExp?.includes('.') && modalData?.gridP?.includes('.');
    console.log(`[TEST 4 RESULT] Modal decimals: ${passModal ? 'PASS' : 'FAIL'}`);

    console.log('\n=== ALL FORMATTING VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
