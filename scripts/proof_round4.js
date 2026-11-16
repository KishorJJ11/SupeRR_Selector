import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = 'C:/Users/Kishor/.gemini/antigravity/brain/f92796e5-3332-49e5-9f67-85580d445541/scratch/round4_proof';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log('Starting preview server on port 4174...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4174'], {
    cwd: 'C:/Users/Kishor/OneDrive/Desktop/RR1',
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', d => console.log(`[server] ${d}`));
  server.stderr.on('data', d => console.error(`[server err] ${d}`));

  await new Promise(res => setTimeout(res, 3000));

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4174', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Measure Hero Height
    const heroMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.clip-diagonal-hero');
      if (!hero) return null;
      const rect = hero.getBoundingClientRect();
      const style = window.getComputedStyle(hero);
      return {
        heightPx: rect.height,
        widthPx: rect.width,
        minHeight: style.minHeight
      };
    });

    // 2. Measure Podium Card Heights
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

    // 3. Measure Table Column Widths (Hitters)
    const hittersTableMetrics = await page.evaluate(() => {
      const table = document.querySelector('table.table-fixed');
      if (!table) return null;
      const ths = Array.from(table.querySelectorAll('thead th'));
      const tableWidth = table.getBoundingClientRect().width;
      return {
        tableWidth,
        columns: ths.map(th => {
          const r = th.getBoundingClientRect();
          return {
            text: th.innerText.trim(),
            widthPx: r.width,
            widthPercent: ((r.width / tableWidth) * 100).toFixed(1) + '%'
          };
        })
      };
    });

    // Screenshots at 1440px
    const heroEl = await page.$('.clip-diagonal-hero');
    if (heroEl) await heroEl.screenshot({ path: path.join(OUT_DIR, 'round4_proof_hero_1440px.png') });

    const podiumEl = await page.$('.bg-\\[\\#1B3FA0\\].rounded-3xl');
    if (podiumEl) await podiumEl.screenshot({ path: path.join(OUT_DIR, 'round4_proof_hitters_podium_1440px.png') });

    const tableEl = await page.$('table.table-fixed');
    if (tableEl) await tableEl.screenshot({ path: path.join(OUT_DIR, 'round4_proof_hitters_table_1440px.png') });

    // Switch to Bowlers Tab
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
      return {
        tableWidth,
        columns: ths.map(th => {
          const r = th.getBoundingClientRect();
          return {
            text: th.innerText.trim(),
            widthPx: r.width,
            widthPercent: ((r.width / tableWidth) * 100).toFixed(1) + '%'
          };
        })
      };
    });

    const bowlersPodiumEl = await page.$('.bg-\\[\\#1B3FA0\\].rounded-3xl');
    if (bowlersPodiumEl) await bowlersPodiumEl.screenshot({ path: path.join(OUT_DIR, 'round4_proof_bowlers_podium_1440px.png') });

    const bowlersTableEl = await page.$('table.table-fixed');
    if (bowlersTableEl) await bowlersTableEl.screenshot({ path: path.join(OUT_DIR, 'round4_proof_bowlers_table_1440px.png') });

    const proofReport = {
      heroMetrics,
      podiumMetrics,
      hittersTableMetrics,
      bowlersPodiumMetrics,
      bowlersTableMetrics
    };

    fs.writeFileSync(path.join(OUT_DIR, 'proof_report.json'), JSON.stringify(proofReport, null, 2));
    console.log('PROOF_REPORT_DONE');
    console.log(JSON.stringify(proofReport, null, 2));

  } finally {
    await browser.close();
    server.kill();
    // On windows kill child processes on 4174
    try {
      spawn('npx', ['kill-port', '4174'], { shell: true });
    } catch (e) {}
  }
}

run().catch(err => {
  console.error('PROOF_FAILED:', err);
  process.exit(1);
});
