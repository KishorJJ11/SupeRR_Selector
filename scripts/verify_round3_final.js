import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = 'C:/Users/Kishor/.gemini/antigravity/brain/f92796e5-3332-49e5-9f67-85580d445541/scratch/round3_verified';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: 'C:/Users/Kishor/OneDrive/Desktop/RR1',
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', d => console.log(`[server] ${d}`));
  server.stderr.on('data', d => console.error(`[server err] ${d}`));

  // Wait for server to become responsive
  await new Promise(res => setTimeout(res, 3000));

  const browser = await chromium.launch();
  const report = {};

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP 1440px Test
    // -------------------------------------------------------------
    console.log('Testing at 1440px...');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check horizontal scroll
    const horizScroll1440 = await page.evaluate(() => {
      return {
        windowWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
      };
    });

    // Check container widths
    const containerMetrics = await page.evaluate(() => {
      const headerInner = document.querySelector('header > div');
      const heroInner = document.querySelector('.clip-diagonal-hero > div:nth-child(2)');
      const main = document.querySelector('main');
      return {
        headerInnerWidth: headerInner ? headerInner.getBoundingClientRect().width : null,
        heroInnerWidth: heroInner ? heroInner.getBoundingClientRect().width : null,
        mainWidth: main ? main.getBoundingClientRect().width : null,
        mainComputedMaxWidth: main ? window.getComputedStyle(main).maxWidth : null
      };
    });

    // Check Hero KPI card 4
    const heroKpi4 = await page.evaluate(() => {
      const kpis = document.querySelectorAll('.clip-diagonal-hero .grid > div');
      if (kpis.length >= 4) {
        return {
          label: kpis[3].querySelector('span:first-child')?.innerText?.trim(),
          value: kpis[3].querySelector('span:last-child')?.innerText?.trim()
        };
      }
      return null;
    });

    // Check Podium card heights & scaling
    const podiumMetrics = await page.evaluate(() => {
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

    // Check Table column widths & workload text
    const tableMetrics = await page.evaluate(() => {
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

      // Check workload text elements in table
      const firstRowWorkload = table.querySelector('tbody tr td:nth-child(8)');
      const workloadLines = firstRowWorkload ? Array.from(firstRowWorkload.querySelectorAll('div div')).map(d => d.innerText.trim()) : [];

      // Check Model fits label in player cell
      const firstRowPlayerCell = table.querySelector('tbody tr td:nth-child(2)');
      const fitsText = firstRowPlayerCell ? firstRowPlayerCell.innerText : '';

      return {
        columnCount: ths.length,
        columns: cols,
        tableWidth,
        workloadLines,
        fitsTextFound: fitsText.includes('Model fits: 25/25')
      };
    });

    // Check Table footnote
    const footnoteText = await page.evaluate(() => {
      const p = document.querySelector('p.italic');
      return p ? p.innerText.trim() : null;
    });

    // Check Floating Ask Scout Button
    const floatingButtonMetrics = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Ask Scout"]');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const style = window.getComputedStyle(btn);
      return {
        widthPx: rect.width,
        heightPx: rect.height,
        borderRadius: style.borderRadius,
        bottomOffset: window.innerHeight - rect.bottom,
        rightOffset: window.innerWidth - rect.right,
        title: btn.getAttribute('title')
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

    // Check "How to read this" collapsible panel
    const howToReadToggle = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-expanded]');
      if (!btn) return { exists: false };
      const initiallyOpen = btn.getAttribute('aria-expanded') === 'true';
      return {
        exists: true,
        initiallyOpen
      };
    });

    // Take 1440px screenshots
    await page.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_full_hitters.png'), fullPage: false });
    
    // Zoom in on Hero
    const heroEl = await page.$('.clip-diagonal-hero');
    if (heroEl) await heroEl.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_hero.png') });

    // Zoom in on Podium
    const podiumEl = await page.$('.bg-\\[\\#1B3FA0\\].rounded-3xl');
    if (podiumEl) await podiumEl.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_hitters_podium.png') });

    // Zoom in on Table
    const tableEl = await page.$('table.table-fixed');
    if (tableEl) await tableEl.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_hitters_table.png') });

    // Test Bowlers Tab
    console.log('Switching to Bowling Surge tab...');
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
          heightPx: rect.height
        };
      });
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
    if (bowlersPodiumEl) await bowlersPodiumEl.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_bowlers_podium.png') });

    const bowlersTableEl = await page.$('table.table-fixed');
    if (bowlersTableEl) await bowlersTableEl.screenshot({ path: path.join(OUT_DIR, 'round3_1440px_bowlers_table.png') });

    // -------------------------------------------------------------
    // 2. DESKTOP 1920px Test
    // -------------------------------------------------------------
    console.log('Testing at 1920px...');
    const page1920 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page1920.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page1920.waitForTimeout(800);

    const horizScroll1920 = await page1920.evaluate(() => {
      return {
        windowWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
      };
    });

    const container1920 = await page1920.evaluate(() => {
      const main = document.querySelector('main');
      return {
        mainWidth: main ? main.getBoundingClientRect().width : null,
        mainComputedMaxWidth: main ? window.getComputedStyle(main).maxWidth : null
      };
    });

    await page1920.screenshot({ path: path.join(OUT_DIR, 'round3_1920px_full.png'), fullPage: false });

    // -------------------------------------------------------------
    // 3. TABLET 768px Test
    // -------------------------------------------------------------
    console.log('Testing at 768px...');
    const page768 = await browser.newPage({ viewport: { width: 768, height: 1024 } });
    await page768.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page768.waitForTimeout(800);
    const horizScroll768 = await page768.evaluate(() => ({
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));
    await page768.screenshot({ path: path.join(OUT_DIR, 'round3_768px_tablet.png'), fullPage: false });

    // -------------------------------------------------------------
    // 4. MOBILE 360px Test
    // -------------------------------------------------------------
    console.log('Testing at 360px...');
    const page360 = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await page360.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    await page360.waitForTimeout(800);
    const horizScroll360 = await page360.evaluate(() => ({
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
    }));

    const rank10Mobile = await page360.evaluate(() => {
      return document.body.innerText.includes('#10');
    });

    await page360.screenshot({ path: path.join(OUT_DIR, 'round3_360px_mobile.png'), fullPage: false });

    // Compile report
    report.horizScroll1440 = horizScroll1440;
    report.horizScroll1920 = horizScroll1920;
    report.horizScroll768 = horizScroll768;
    report.horizScroll360 = horizScroll360;
    report.containerMetrics = containerMetrics;
    report.container1920 = container1920;
    report.heroKpi4 = heroKpi4;
    report.podiumMetrics = podiumMetrics;
    report.bowlersPodiumMetrics = bowlersPodiumMetrics;
    report.tableMetrics = tableMetrics;
    report.footnoteText = footnoteText;
    report.floatingButtonMetrics = floatingButtonMetrics;
    report.rank10Batter = rank10Batter;
    report.rank10Bowler = rank10Bowler;
    report.rank10Mobile = rank10Mobile;
    report.howToReadToggle = howToReadToggle;

    fs.writeFileSync(
      path.join(OUT_DIR, 'final_metrics_report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('REPORT_WRITTEN_SUCCESSFULLY');
    console.log(JSON.stringify(report, null, 2));

  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('VERIFY_FAILED:', err);
  process.exit(1);
});
