import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function testV12Lock() {
  console.log('Starting preview server on port 4178...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4178'], {
    cwd: 'C:/Users/Kishor/OneDrive/Desktop/RR1',
    shell: true,
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 3500));
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4178', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const results = {};

    // 1. Check Subtitle on Hitters Tab
    results.hittersSubtitle = await page.evaluate(() => {
      const p = document.querySelector('h2 + p') || Array.from(document.querySelectorAll('p')).find(el => el.innerText.includes('Ordered by'));
      return p ? p.innerText.trim() : null;
    });

    // 2. Check Delta Hover Definition
    results.allThs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('th')).map(t => ({
        text: t.innerText,
        title: t.getAttribute('title')
      }));
    });

    results.tableHeaderDeltaTitle = await page.evaluate(() => {
      const th = Array.from(document.querySelectorAll('th')).find(t => t.innerText.toLowerCase().includes('delta'));
      return th ? th.getAttribute('title') : null;
    });

    results.podiumDeltaTitle = await page.evaluate(() => {
      const chip = document.querySelector('[title="Pressure rating minus ordinary (non-pressure) rating."]');
      return chip ? chip.getAttribute('title') : null;
    });

    // 3. Check Model Fits UI Format
    results.podiumFitAgreementText = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const fitSpan = spans.find(s => s.innerText.includes('Fit agreement:'));
      return fitSpan ? fitSpan.innerText.trim() : null;
    });

    results.tableFitAgreementText = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const fitDiv = divs.find(d => d.innerText.includes('Fit agreement:') && d.closest('tbody'));
      return fitDiv ? fitDiv.innerText.trim() : null;
    });

    // Switch to Bowlers Tab
    const bowlersBtn = page.getByRole('button', { name: /bowling surge|bowlers/i });
    if (await bowlersBtn.count() > 0) {
      await bowlersBtn.first().click();
      await page.waitForTimeout(500);

      results.bowlersSubtitle = await page.evaluate(() => {
        const p = Array.from(document.querySelectorAll('p')).find(el => el.innerText.includes('Ordered by'));
        return p ? p.innerText.trim() : null;
      });

      results.bowlersPodiumFitText = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const fitSpan = spans.find(s => s.innerText.includes('Fit agreement:'));
        return fitSpan ? fitSpan.innerText.trim() : null;
      });
    }

    console.log('--- V12 LOCK TEST RESULTS ---');
    console.log(JSON.stringify(results, null, 2));

    const allPassed = 
      results.hittersSubtitle === 'Ordered by Expected Rank.' &&
      results.bowlersSubtitle === 'Ordered by Expected Rank.' &&
      results.tableHeaderDeltaTitle === 'Pressure rating minus ordinary (non-pressure) rating.' &&
      results.podiumDeltaTitle === 'Pressure rating minus ordinary (non-pressure) rating.' &&
      results.podiumFitAgreementText?.includes('Fit agreement:') &&
      results.podiumFitAgreementText?.includes('% of 25 fits') &&
      results.tableFitAgreementText?.includes('Fit agreement:') &&
      results.tableFitAgreementText?.includes('% of 25 fits');

    console.log('ALL TESTS PASSED:', allPassed);
    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.kill();
    try { spawn('npx', ['kill-port', '4178'], { shell: true }); } catch (e) {}
  }
}

testV12Lock().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
