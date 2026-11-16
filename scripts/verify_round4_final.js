import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = 'C:/Users/Kishor/.gemini/antigravity/brain/f92796e5-3332-49e5-9f67-85580d445541/scratch/round4_verified';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting preview server on port 4176...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4176'], {
    cwd: 'C:/Users/Kishor/OneDrive/Desktop/RR1',
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', d => console.log(`[server] ${d}`));
  server.stderr.on('data', d => console.error(`[server err] ${d}`));

  await new Promise(res => setTimeout(res, 4000));

  const browser = await chromium.launch();
  const report = {};

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP 1440px Test
    // -------------------------------------------------------------
    console.log('Testing at 1440px...');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4176', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Hero Metrics
    const heroMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.clip-diagonal-hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      const style = window.getComputedStyle(hero);
      return {
        heightPx: rect.height,
        minHeight: style.minHeight,
        meetsTarget: rect.height >= 640 && rect.height <= 780
      };
    });

    // Podium Metrics
    const podiumMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div'));
      return cards.map((c, i) => {
        const rect = c.getBoundingClientRect();
        const header = c.querySelector('.relative.bg-\\[\\#050D2B\\]');
        const imgSlot = c.querySelector('.relative.w-full.h-\\[200px\\]');
        const hasPlaceholder = Array.from(c.querySelectorAll('span')).some(s => s.innerText.includes('PLACEHOLDER'));
        return {
          cardIndex: i + 1,
          name: c.querySelector('h3')?.innerText?.trim(),
          heightPx: rect.height,
          widthPx: rect.width,
          headerHeightPx: header ? header.getBoundingClientRect().height : null,
          imgSlotHeightPx: imgSlot ? imgSlot.getBoundingClientRect().height : null,
          hasPlaceholderBadge: hasPlaceholder
        };
      });
    });

    // Hitters Table Column Metrics & Overlap Check
    const hittersTableMetrics = await page.evaluate(() => {
      const table = document.querySelector('table.table-fixed');
      if (!table) return null;
      const ths = Array.from(table.querySelectorAll('thead th'));
      const tableWidth = table.getBoundingClientRect().width;
      const cols = ths.map(th => {
        const r = th.getBoundingClientRect();
        return {
          text: th.innerText.trim(),
          widthPx: r.width,
          widthPercent: ((r.width / tableWidth) * 100).toFixed(1) + '%'
        };
      });

      // Check Delta vs Phase & Workload bounding boxes for row 1
      const row1Delta = table.querySelector('tbody tr:first-child td:nth-child(7)');
      const row1Phase = table.querySelector('tbody tr:first-child td:nth-child(8)');
      const deltaRect = row1Delta ? row1Delta.getBoundingClientRect() : null;
      const phaseRect = row1Phase ? row1Phase.getBoundingClientRect() : null;
      const hasOverlap = deltaRect && phaseRect ? deltaRect.right > phaseRect.left : false;

      // Check placeholder tooltip in table
      const firstRowPlayerImg = table.querySelector('tbody tr:first-child td:nth-child(2) [title]');
      const tooltipText = firstRowPlayerImg ? firstRowPlayerImg.getAttribute('title') : null;

      return {
        tableWidth,
        columns: cols,
        hasOverlap,
        deltaRight: deltaRect ? deltaRect.right : null,
        phaseLeft: phaseRect ? phaseRect.left : null,
        tablePlaceholderTooltip: tooltipText
      };
    });

    // Check Rank 10 Batter is visible
    const rank10Batter = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const r10 = rows.find(r => r.innerText.includes('10'));
      return {
        found: !!r10,
        text: r10 ? r10.innerText.split('\n')[0] : null
      };
    });

    // Check horizontal scroll at 1440
    const horizScroll1440 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));

    // Screenshots at 1440
    const heroEl = await page.$('.clip-diagonal-hero');
    if (heroEl) await heroEl.screenshot({ path: path.join(OUT_DIR, 'round4_1440px_hero.png') });

    const podiumEl = await page.$('.bg-\\[\\#1B3FA0\\].rounded-3xl');
    if (podiumEl) await podiumEl.screenshot({ path: path.join(OUT_DIR, 'round4_1440px_hitters_podium.png') });

    const tableEl = await page.$('table.table-fixed');
    if (tableEl) await tableEl.screenshot({ path: path.join(OUT_DIR, 'round4_1440px_hitters_table.png') });

    // Switch to Bowlers Tab
    console.log('Testing Bowling Surge tab at 1440px...');
    const bowlersTabBtn = page.getByRole('button', { name: /bowling surge/i });
    await bowlersTabBtn.click();
    await page.waitForTimeout(600);

    const bowlersPodiumMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div'));
      return cards.map((c, i) => {
        const rect = c.getBoundingClientRect();
        return {
          cardIndex: i + 1,
          name: c.querySelector('h3')?.innerText?.trim(),
          heightPx: rect.height,
          widthPx: rect.width
        };
      });
    });

    const bowlersTableMetrics = await page.evaluate(() => {
      const table = document.querySelector('table.table-fixed');
      if (!table) return null;
      const ths = Array.from(table.querySelectorAll('thead th'));
      const tableWidth = table.getBoundingClientRect().width;
      const cols = ths.map(th => {
        const r = th.getBoundingClientRect();
        return {
          text: th.innerText.trim(),
          widthPx: r.width,
          widthPercent: ((r.width / tableWidth) * 100).toFixed(1) + '%'
        };
      });

      const row1Delta = table.querySelector('tbody tr:first-child td:nth-child(7)');
      const row1Phase = table.querySelector('tbody tr:first-child td:nth-child(8)');
      const deltaRect = row1Delta ? row1Delta.getBoundingClientRect() : null;
      const phaseRect = row1Phase ? row1Phase.getBoundingClientRect() : null;
      const hasOverlap = deltaRect && phaseRect ? deltaRect.right > phaseRect.left : false;

      return {
        tableWidth,
        columns: cols,
        hasOverlap
      };
    });

    const rank10Bowler = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const r10 = rows.find(r => r.innerText.includes('10'));
      return {
        found: !!r10,
        text: r10 ? r10.innerText.split('\n')[0] : null
      };
    });

    const bowlersPodiumEl = await page.$('.bg-\\[\\#1B3FA0\\].rounded-3xl');
    if (bowlersPodiumEl) await bowlersPodiumEl.screenshot({ path: path.join(OUT_DIR, 'round4_1440px_bowlers_podium.png') });

    const bowlersTableEl = await page.$('table.table-fixed');
    if (bowlersTableEl) await bowlersTableEl.screenshot({ path: path.join(OUT_DIR, 'round4_1440px_bowlers_table.png') });

    // -------------------------------------------------------------
    // 2. DESKTOP 1920px Test
    // -------------------------------------------------------------
    console.log('Testing at 1920px...');
    const page1920 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page1920.goto('http://localhost:4176', { waitUntil: 'domcontentloaded' });
    await page1920.waitForTimeout(800);

    const horizScroll1920 = await page1920.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));

    await page1920.screenshot({ path: path.join(OUT_DIR, 'round4_1920px_full.png'), fullPage: false });

    // -------------------------------------------------------------
    // 3. TABLET 768px Test
    // -------------------------------------------------------------
    console.log('Testing at 768px...');
    const page768 = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await page768.goto('http://localhost:4176', { waitUntil: 'domcontentloaded' });
    await page768.waitForTimeout(800);

    const horizScroll768 = await page768.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));

    await page768.screenshot({ path: path.join(OUT_DIR, 'round4_768px_tablet.png'), fullPage: false });

    // -------------------------------------------------------------
    // 4. MOBILE 360px Test
    // -------------------------------------------------------------
    console.log('Testing at 360px...');
    const page360 = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await page360.goto('http://localhost:4176', { waitUntil: 'domcontentloaded' });
    await page360.waitForTimeout(800);

    const horizScroll360 = await page360.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));

    const rank10Mobile = await page360.evaluate(() => {
      return document.body.innerText.includes('#10');
    });

    await page360.screenshot({ path: path.join(OUT_DIR, 'round4_360px_mobile.png'), fullPage: false });

    // Compile report
    report.heroMetrics = heroMetrics;
    report.podiumMetrics = podiumMetrics;
    report.bowlersPodiumMetrics = bowlersPodiumMetrics;
    report.hittersTableMetrics = hittersTableMetrics;
    report.bowlersTableMetrics = bowlersTableMetrics;
    report.rank10Batter = rank10Batter;
    report.rank10Bowler = rank10Bowler;
    report.rank10Mobile = rank10Mobile;
    report.horizScroll1440 = horizScroll1440;
    report.horizScroll1920 = horizScroll1920;
    report.horizScroll768 = horizScroll768;
    report.horizScroll360 = horizScroll360;

    fs.writeFileSync(path.join(OUT_DIR, 'final_metrics_report.json'), JSON.stringify(report, null, 2));
    console.log('VERIFY_COMPLETE');
    console.log(JSON.stringify(report, null, 2));

  } finally {
    await browser.close();
    server.kill();
    try {
      spawn('npx', ['kill-port', '4176'], { shell: true });
    } catch (e) {}
  }
}

run().catch(err => {
  console.error('VERIFY_FAILED:', err);
  process.exit(1);
});
