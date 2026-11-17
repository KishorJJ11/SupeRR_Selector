import { chromium } from 'playwright';
import * as path from 'path';

async function runAudit() {
  console.log('=== VERIFYING FINAL UI LOCK (V16) ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const pageContent = await page.content();

    // 1. Check Global Replacements for 'Ordered by expected rank (posterior)'
    const hasOldOrderedBy = pageContent.includes('Ordered by Expected Rank');
    const hasOldPosteriorExpRank = pageContent.includes('Posterior Expected Rank');
    const hasExpectedRankPosterior = pageContent.includes('Ordered by expected rank (posterior)');

    console.log('[CHECK 1] Global Text Replacement:');
    console.log(`  - Old 'Ordered by Expected Rank' absent: ${!hasOldOrderedBy ? 'PASS' : 'FAIL'}`);
    console.log(`  - Old 'Posterior Expected Rank' absent: ${!hasOldPosteriorExpRank ? 'PASS' : 'FAIL'}`);
    console.log(`  - New 'Ordered by expected rank (posterior)' present: ${hasExpectedRankPosterior ? 'PASS' : 'FAIL'}`);

    // Check Hero KPI card text
    const heroCardText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === 'Ordered by expected rank (posterior)');
      return el ? el.textContent.trim() : null;
    });
    console.log(`  - Hero KPI card has 'Ordered by expected rank (posterior)': ${heroCardText === 'Ordered by expected rank (posterior)' ? 'PASS' : 'FAIL'}`);

    // Check Hitters subtitle
    const hittersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Batting Leverage Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`  - Hitters Subtitle: "${hittersSubtitle}" -> ${hittersSubtitle === 'Ordered by expected rank (posterior)' ? 'PASS' : 'FAIL'}`);

    // Switch to Bowlers view to check Bowlers subtitle
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(500);

    const bowlersSubtitle = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('Bowling Surge Dossier'));
      const p = h2?.parentElement?.querySelector('p');
      return p ? p.textContent.trim() : '';
    });
    console.log(`  - Bowlers Subtitle: "${bowlersSubtitle}" -> ${bowlersSubtitle === 'Ordered by expected rank (posterior)' ? 'PASS' : 'FAIL'}`);

    // Switch back to Hitters
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Batting leverage'));
      if (b) b.click();
    });
    await page.waitForTimeout(500);

    // 2. Check Model-fragility flag inside player cards
    const fragilityReportHitters = await page.evaluate(() => {
      // Check podium cards
      const podium = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group')).map(c => {
        const name = c.querySelector('h3')?.textContent.trim() || '';
        const hasFlag = c.textContent.includes('Model-fragility flag');
        return { name, hasFlag };
      });

      // Check table rows
      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const name = r.querySelector('.player-name')?.textContent.trim() || '';
        const hasFlag = r.textContent.includes('Model-fragility flag');
        return { name, hasFlag };
      });

      return [...podium, ...tableData];
    });

    console.log('\n[CHECK 2A] Hitters Model-Fragility Flags:');
    console.table(fragilityReportHitters);

    // Verify Phil Salt and Tim David have flag, others do not
    const saltFlag = fragilityReportHitters.find(p => p.name === 'Phil Salt')?.hasFlag;
    const davidFlag = fragilityReportHitters.find(p => p.name === 'Tim David')?.hasFlag;
    const klaasenFlag = fragilityReportHitters.find(p => p.name === 'Heinrich Klaasen')?.hasFlag;
    const buttlerFlag = fragilityReportHitters.find(p => p.name === 'Jos Buttler')?.hasFlag;

    console.log(`  - Phil Salt has Model-fragility flag (expected true): ${saltFlag === true ? 'PASS' : 'FAIL'}`);
    console.log(`  - Tim David has Model-fragility flag (expected true): ${davidFlag === true ? 'PASS' : 'FAIL'}`);
    console.log(`  - Heinrich Klaasen has Model-fragility flag (expected false): ${klaasenFlag === false ? 'PASS' : 'FAIL'}`);
    console.log(`  - Jos Buttler has Model-fragility flag (expected false): ${buttlerFlag === false ? 'PASS' : 'FAIL'}`);

    // Switch to Bowlers view to check Bowlers fragility
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(500);

    const fragilityReportBowlers = await page.evaluate(() => {
      const podium = Array.from(document.querySelectorAll('.bg-\\[\\#1B3FA0\\] .group')).map(c => {
        const name = c.querySelector('h3')?.textContent.trim() || '';
        const hasFlag = c.textContent.includes('Model-fragility flag');
        return { name, hasFlag };
      });

      const table = Array.from(document.querySelectorAll('table')).find(t => t.textContent.includes('Phase & Workload'));
      const tableRows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
      const tableData = tableRows.map(r => {
        const name = r.querySelector('.player-name')?.textContent.trim() || '';
        const hasFlag = r.textContent.includes('Model-fragility flag');
        return { name, hasFlag };
      });

      return [...podium, ...tableData];
    });

    console.log('\n[CHECK 2B] Bowlers Model-Fragility Flags:');
    console.table(fragilityReportBowlers);

    const narineFlag = fragilityReportBowlers.find(p => p.name === 'Sunil Narine')?.hasFlag;
    const taskinFlag = fragilityReportBowlers.find(p => p.name === 'Taskin Ahmed')?.hasFlag;
    const rashidFlag = fragilityReportBowlers.find(p => p.name === 'Rashid Khan')?.hasFlag;
    const bumrahFlag = fragilityReportBowlers.find(p => p.name === 'Jasprit Bumrah')?.hasFlag;

    console.log(`  - Sunil Narine has Model-fragility flag (expected false): ${narineFlag === false ? 'PASS' : 'FAIL'}`);
    console.log(`  - Taskin Ahmed has Model-fragility flag (expected true): ${taskinFlag === true ? 'PASS' : 'FAIL'}`);
    console.log(`  - Rashid Khan has Model-fragility flag (expected true): ${rashidFlag === true ? 'PASS' : 'FAIL'}`);
    console.log(`  - Jasprit Bumrah has Model-fragility flag (expected false): ${bumrahFlag === false ? 'PASS' : 'FAIL'}`);

    // 3. Check Validation Table with Binomial P-Value
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
          binomialP: cells[4],
          validN: cells[5],
          expectedHits: cells[6],
          status: cells[7]
        };
      });
      return { ths, rows };
    });

    console.log('\n[CHECK 3] Validation Table Headers:');
    console.log(validationInfo.ths);
    console.log('[CHECK 3] Validation Table Rows:');
    console.table(validationInfo.rows);

    const hasBinomialCol = validationInfo.ths.some(th => th.includes('Binomial P-Value'));
    console.log(`  - 'Binomial P-Value' column header present: ${hasBinomialCol ? 'PASS' : 'FAIL'}`);

    const batRow = validationInfo.rows.find(r => r.role === 'Batters');
    const bowRow = validationInfo.rows.find(r => r.role === 'Bowlers');
    console.log(`  - Batters Binomial P-Value == '0.25': ${batRow.binomialP === '0.25' ? 'PASS' : `FAIL (${batRow.binomialP})`}`);
    console.log(`  - Bowlers Binomial P-Value == '0.01': ${bowRow.binomialP === '0.01' ? 'PASS' : `FAIL (${bowRow.binomialP})`}`);

    // Check zero occurrences of 'Fit agreement' in DOM
    const hasFitAgreement = (await page.content()).includes('Fit agreement');
    console.log(`\n[CHECK 4] Zero 'Fit agreement' in DOM: ${!hasFitAgreement ? 'PASS' : 'FAIL'}`);

    // Screenshot
    await page.screenshot({ path: 'scratch/v16_final_lock_verification.png', fullPage: true });
    console.log('\nSaved screenshot to scratch/v16_final_lock_verification.png');

    console.log('\n=== ALL V16 AUDIT CHECKS COMPLETED ===');
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
