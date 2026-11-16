import { chromium } from 'playwright';
import { spawn } from 'child_process';
import * as path from 'path';

async function verifyNavbar() {
  const server = spawn('npx', ['vite', 'preview', '--port', '4183'], {
    cwd: 'C:/Users/Kishor/OneDrive/Desktop/RR1',
    shell: true,
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 3500));
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:4183', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const desktopMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const logo = document.querySelector('header img[alt="Rajasthan Royals"]');
      return {
        headerHeight: header ? header.getBoundingClientRect().height : null,
        logoHeight: logo ? logo.getBoundingClientRect().height : null,
        logoWidth: logo ? logo.getBoundingClientRect().width : null
      };
    });

    const header = await page.$('header');
    if (header) {
      await header.screenshot({ path: 'scratch/navbar_increased_1440.png' });
    }

    const pageMobile = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await pageMobile.goto('http://localhost:4183', { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForTimeout(1000);

    const mobileMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const logo = document.querySelector('header img[alt="Rajasthan Royals"]');
      return {
        headerHeight: header ? header.getBoundingClientRect().height : null,
        logoHeight: logo ? logo.getBoundingClientRect().height : null,
        logoWidth: logo ? logo.getBoundingClientRect().width : null
      };
    });

    const headerMobile = await pageMobile.$('header');
    if (headerMobile) {
      await headerMobile.screenshot({ path: 'scratch/navbar_increased_360.png' });
    }

    console.log('Desktop Metrics:', desktopMetrics);
    console.log('Mobile Metrics:', mobileMetrics);
  } finally {
    await browser.close();
    server.kill();
    try { spawn('npx', ['kill-port', '4183'], { shell: true }); } catch (e) {}
  }
}

verifyNavbar().catch(e => {
  console.error(e);
  process.exit(1);
});
