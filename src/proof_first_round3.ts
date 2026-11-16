import { chromium } from 'playwright';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

function createStaticServer(distPath: string, port: number) {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url || '/';
    if (reqUrl === '/') reqUrl = '/index.html';
    const filePath = path.join(distPath, reqUrl.split('?')[0]);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const indexPath = path.join(distPath, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
    }
  });

  return new Promise<http.Server>((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function run() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const port = 3460;
  const server = await createStaticServer(distDir, port);

  const outDir = 'C:/Users/Kishor/.gemini/antigravity/brain/f92796e5-3332-49e5-9f67-85580d445541/scratch/round3_proof';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // 1. Measure Container Max-Width & Computed Width
    const containerMetrics = await page.evaluate(() => {
      const main = document.querySelector('main');
      const headerContainer = document.querySelector('header > div');
      const heroContainer = document.querySelector('.clip-diagonal-hero');
      const mainStyle = main ? window.getComputedStyle(main) : null;
      return {
        mainMaxWidth: mainStyle?.maxWidth,
        mainWidth: main?.getBoundingClientRect().width,
        headerWidth: headerContainer?.getBoundingClientRect().width,
        heroWidth: heroContainer?.getBoundingClientRect().width,
      };
    });

    // 2. Measure Table Column Widths (Hitters)
    const hittersColumnMetrics = await page.evaluate(() => {
      const ths = Array.from(document.querySelectorAll('table thead th'));
      return ths.map(th => ({
        text: th.textContent?.trim(),
        widthPx: th.getBoundingClientRect().width,
        widthPercent: `${((th.getBoundingClientRect().width / (th.closest('table')?.getBoundingClientRect().width || 1)) * 100).toFixed(1)}%`
      }));
    });

    // 3. Measure Podium Card Height at 1440px
    const podiumMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-3 > div'));
      return cards.map((c, i) => ({
        cardIndex: i + 1,
        heightPx: c.getBoundingClientRect().height,
        widthPx: c.getBoundingClientRect().width,
      }));
    });

    // 4. Capture Proof Screenshots (Hitters)
    console.log('Capturing Hero screenshot...');
    const hero = page.locator('div.clip-diagonal-hero').first();
    await hero.screenshot({ path: path.join(outDir, 'round3_proof_hero_1440px.png') });

    console.log('Capturing Hitters Podium screenshot...');
    const hittersPodium = page.locator('div.bg-\\[\\#1B3FA0\\].rounded-3xl').first();
    await hittersPodium.screenshot({ path: path.join(outDir, 'round3_proof_hitters_podium_1440px.png') });

    console.log('Capturing Hitters 4-10 Table screenshot...');
    const hittersTable = page.locator('div.hidden.md\\:block.overflow-hidden.rounded-2xl').first();
    await hittersTable.screenshot({ path: path.join(outDir, 'round3_proof_hitters_table_1440px.png') });

    // 5. Switch to Bowlers Tab
    console.log('Switching to Bowlers...');
    const bowlersBtn = page.locator('button:has-text("Bowlers"), button:has-text("Bowling surge")').first();
    await bowlersBtn.click();
    await page.waitForTimeout(500);

    // 6. Measure Table Column Widths (Bowlers)
    const bowlersColumnMetrics = await page.evaluate(() => {
      const ths = Array.from(document.querySelectorAll('table thead th'));
      return ths.map(th => ({
        text: th.textContent?.trim(),
        widthPx: th.getBoundingClientRect().width,
        widthPercent: `${((th.getBoundingClientRect().width / (th.closest('table')?.getBoundingClientRect().width || 1)) * 100).toFixed(1)}%`
      }));
    });

    // 7. Capture Proof Screenshots (Bowlers)
    console.log('Capturing Bowlers Podium screenshot...');
    const bowlersPodium = page.locator('div.bg-\\[\\#1B3FA0\\].rounded-3xl').first();
    await bowlersPodium.screenshot({ path: path.join(outDir, 'round3_proof_bowlers_podium_1440px.png') });

    console.log('Capturing Bowlers 4-10 Table screenshot...');
    const bowlersTable = page.locator('div.hidden.md\\:block.overflow-hidden.rounded-2xl').first();
    await bowlersTable.screenshot({ path: path.join(outDir, 'round3_proof_bowlers_table_1440px.png') });

    const proofData = {
      containerMetrics,
      podiumMetrics,
      hittersColumnMetrics,
      bowlersColumnMetrics
    };

    fs.writeFileSync(path.join(outDir, 'proof_metrics_report.json'), JSON.stringify(proofData, null, 2));
    console.log('PROOF_DATA_CAPTURED:', JSON.stringify(proofData, null, 2));

  } catch (err) {
    console.error('Proof capture failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run();
