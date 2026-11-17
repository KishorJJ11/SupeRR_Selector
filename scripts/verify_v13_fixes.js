import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function runAudit() {
  console.log('=== STARTING V13 FINAL DEPLOYMENT AUDIT ===\n');

  if (!fs.existsSync('scratch')) {
    fs.mkdirSync('scratch', { recursive: true });
  }

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    console.log('Loading app from:', distPath);
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // 1. Verify 'Phase Breakdown' is completely removed
    const pageContent = await page.content();
    const hasPhaseBreakdown = pageContent.includes('Phase Breakdown');
    console.log(`[TEST 1] 'Phase Breakdown' in DOM: ${hasPhaseBreakdown ? 'FAIL (found)' : 'PASS (completely absent)'}`);

    // 2. Verify all player portraits are generic silhouettes (no stock/placeholder photos)
    const portraitImagesCount = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const playerImgs = imgs.filter(img => {
        const src = img.src || '';
        return !src.includes('RR_logo') && !src.includes('image_347ddeed') && !src.includes('aistudio');
      });
      const svgBusts = document.querySelectorAll('svg[viewBox="0 0 100 120"]').length;
      return {
        playerPhotoImages: playerImgs.length,
        playerSilhouetteBusts: svgBusts
      };
    });
    console.log(`[TEST 2] Player portraits: ${portraitImagesCount.playerPhotoImages} photo images, ${portraitImagesCount.playerSilhouetteBusts} SVG silhouette busts.`);
    console.log(`[TEST 2 RESULT] ${portraitImagesCount.playerPhotoImages === 0 && portraitImagesCount.playerSilhouetteBusts >= 10 ? 'PASS (all generic silhouettes)' : 'FAIL'}`);

    // 3. Typography pass & Shreyas Iyer rendering
    const typographyResults = await page.evaluate(() => {
      const bodyFont = window.getComputedStyle(document.body).fontFamily;
      
      const rows = Array.from(document.querySelectorAll('tr'));
      let shreyasFont = null;
      let shreyasText = null;
      for (const row of rows) {
        if (row.textContent.includes('Shreyas Iyer')) {
          const nameEl = row.querySelector('.player-name') || row.querySelector('td:nth-child(2)');
          if (nameEl) {
            shreyasFont = window.getComputedStyle(nameEl).fontFamily;
            shreyasText = nameEl.textContent.trim();
          }
        }
      }

      const ratingEls = Array.from(document.querySelectorAll('td:nth-child(3) span'));
      const ratingFonts = ratingEls.map(el => window.getComputedStyle(el).fontFamily);

      const expectedRankEls = Array.from(document.querySelectorAll('td:nth-child(5)'));
      const expectedRankFonts = expectedRankEls.map(el => window.getComputedStyle(el).fontFamily);

      // Check small font sizes across document (desktop)
      const allEls = Array.from(document.querySelectorAll('body *'));
      const below12_0 = [];
      for (const el of allEls) {
        if (el.children.length === 0 && el.textContent.trim().length > 0 && el.offsetParent !== null) {
          const style = window.getComputedStyle(el);
          const size = parseFloat(style.fontSize);
          const isCode = el.tagName === 'CODE' || el.tagName === 'PRE';
          if (size < 12.0 && !isCode) {
            below12_0.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 30), size: size });
          }
        }
      }

      return {
        bodyFont,
        shreyasFont,
        shreyasText,
        sampleRatingFont: ratingFonts[0] || null,
        sampleExpectedRankFont: expectedRankFonts[0] || null,
        elementsBelow12pxCount: below12_0.length,
        elementsBelow12pxSample: below12_0.slice(0, 5)
      };
    });

    console.log(`[TEST 3] Body Font: ${typographyResults.bodyFont}`);
    console.log(`[TEST 3] Shreyas Iyer Font: ${typographyResults.shreyasFont}`);
    console.log(`[TEST 3] Pressure Rating Font: ${typographyResults.sampleRatingFont}`);
    console.log(`[TEST 3] Expected Rank Font: ${typographyResults.sampleExpectedRankFont}`);
    console.log(`[TEST 3] Desktop elements < 12px: ${typographyResults.elementsBelow12pxCount}`);
    if (typographyResults.elementsBelow12pxCount > 0) {
      console.log('Sample elements below 12px:', typographyResults.elementsBelow12pxSample);
    }
    const shreyasPass = typographyResults.shreyasFont && typographyResults.shreyasFont.includes('Times');
    console.log(`[TEST 3 RESULT] Shreyas Iyer serif rendering: ${shreyasPass ? 'PASS (Times New Roman serif)' : 'FAIL'}`);

    // 4. Floating chat button vs Methodology button overlap check
    const overlapResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const methBtn = buttons.find(b => b.textContent.includes('Methodology'));
      const chatBtn = document.querySelector('button[aria-label="Ask Scout"]') || document.querySelector('button[title="Ask Scout"]');

      if (!methBtn || !chatBtn) {
        return { error: 'Could not find buttons', methFound: !!methBtn, chatFound: !!chatBtn };
      }

      const methRect = methBtn.getBoundingClientRect();
      const chatRect = chatBtn.getBoundingClientRect();

      const horizontalOverlap = !(methRect.right < chatRect.left || methRect.left > chatRect.right);
      const verticalOverlap = !(methRect.bottom < chatRect.top || methRect.top > chatRect.bottom);
      const overlaps = horizontalOverlap && verticalOverlap;
      const horizontalDistance = chatRect.left - methRect.right;

      return {
        overlaps,
        horizontalDistance,
        methRect: { top: Math.round(methRect.top), right: Math.round(methRect.right), bottom: Math.round(methRect.bottom), left: Math.round(methRect.left) },
        chatRect: { top: Math.round(chatRect.top), right: Math.round(chatRect.right), bottom: Math.round(chatRect.bottom), left: Math.round(chatRect.left) }
      };
    });
    console.log('[TEST 4] Button Overlap Rects:', overlapResult);
    console.log(`[TEST 4 RESULT] Overlap: ${overlapResult.overlaps ? 'FAIL (overlapping)' : `PASS (no overlap, clearance = ${Math.round(overlapResult.horizontalDistance)}px)`}`);

    // 5. Visible Tier legend check
    const tierLegendText = await page.evaluate(() => {
      const legend = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Confidence Tier Legend:'));
      return legend ? legend.textContent.replace(/\s+/g, ' ').trim() : null;
    });
    console.log(`[TEST 5] Confidence Tier Legend: ${tierLegendText}`);
    const tierPass = tierLegendText && tierLegendText.includes('Tier A') && tierLegendText.includes('Tier B') && tierLegendText.includes('Tier C');
    console.log(`[TEST 5 RESULT] Tier Legend: ${tierPass ? 'PASS' : 'FAIL'}`);

    // 6. Validation panel check
    const validationPanel = await page.evaluate(() => {
      const panel = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Out-of-Sample Predictive Validation (60/40 Split)'));
      if (!panel) return null;
      const table = panel.querySelector('table');
      const text = panel.textContent.replace(/\s+/g, ' ').trim();
      return {
        found: true,
        hasTable: !!table,
        textSnippet: text.slice(0, 300)
      };
    });
    console.log(`[TEST 6] Validation panel found: ${validationPanel?.found ? 'PASS' : 'FAIL'}`);
    if (validationPanel) {
      console.log(`[TEST 6 Details] ${validationPanel.textSnippet}`);
    }

    // Capture screenshots
    await page.screenshot({ path: 'scratch/v13_hitters_desktop.png', fullPage: false });

    // 7. Bowlers View check
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Bowling surge'));
      if (b) b.click();
    });
    await page.waitForTimeout(500);

    const bowlersPhaseCheck = await page.content();
    const bowlersPhaseFail = bowlersPhaseCheck.includes('Phase Breakdown');
    console.log(`[TEST 7] Bowlers view Phase Breakdown presence: ${bowlersPhaseFail ? 'FAIL (found)' : 'PASS (absent)'}`);
    await page.screenshot({ path: 'scratch/v13_bowlers_desktop.png', fullPage: false });

    // 8. Open Methodology modal to check dark Validation panel
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(btn => btn.textContent.includes('Model notes') || btn.textContent.includes('Methodology'));
      if (b) b.click();
    });
    await page.waitForTimeout(500);
    const modalValidationFound = await page.evaluate(() => {
      return document.body.textContent.includes('Out-of-Sample Predictive Validation');
    });
    console.log(`[TEST 8] Methodology Modal Validation panel: ${modalValidationFound ? 'PASS (present)' : 'FAIL'}`);
    await page.screenshot({ path: 'scratch/v13_methodology_modal.png' });

    console.log('\n=== ALL AUDIT TESTS FINISHED ===');
  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
