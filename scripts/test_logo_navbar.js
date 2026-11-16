
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as path from 'path';

async function testLogo() {
  const server = spawn('npx', ['vite', 'preview', '--port', '4177'], {
    shell: true,
    stdio: 'pipe'
  });
  await new Promise(r => setTimeout(r, 3500));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4177', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    const header = await page.$('header');
    if (header) {
      await header.screenshot({ path: 'scratch/navbar_logo_1440.png' });
      console.log('Saved scratch/navbar_logo_1440.png');
    }

    const pageMobile = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await pageMobile.goto('http://localhost:4177', { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForTimeout(1000);
    const headerMobile = await pageMobile.$('header');
    if (headerMobile) {
      await headerMobile.screenshot({ path: 'scratch/navbar_logo_360.png' });
      console.log('Saved scratch/navbar_logo_360.png');
    }
  } finally {
    await browser.close();
    server.kill();
    try { spawn('npx', ['kill-port', '4177'], { shell: true }); } catch (e) {}
  }
}
testLogo();
