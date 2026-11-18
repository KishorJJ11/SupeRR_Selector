import { chromium } from 'playwright';
import * as path from 'path';

async function run() {
  console.log('=== VERIFYING ASK SCOUT LOCAL JSON AGENT ===\n');

  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
  
  // Track all network requests to prove NO external LLM fetch calls are made
  const networkRequests = [];
  page.on('request', req => {
    networkRequests.push(req.url());
  });

  await page.goto(distPath, { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  let allPassed = true;

  // 1. Verify floating trigger button exists
  const scoutTrigger = page.locator('button[aria-label="Ask Scout"]');
  await scoutTrigger.waitFor({ state: 'visible', timeout: 5000 });
  const triggerVisible = await scoutTrigger.isVisible();
  console.log(`[CHECK 1] Floating 'Ask Scout' button visible: ${triggerVisible ? 'PASS' : 'FAIL'}`);
  if (!triggerVisible) allPassed = false;

  // 2. Open Chat Panel
  await scoutTrigger.click();
  await page.waitForSelector('input[placeholder*="Ask about Salt"]', { timeout: 3000 });
  console.log('[CHECK 2] Ask Scout chat panel opened: PASS');

  // Helper to send query and wait for scout response
  async function sendQueryAndGetResponse(queryText) {
    const input = page.locator('input[placeholder*="Ask about Salt"]');
    await input.fill(queryText);
    await page.keyboard.press('Enter');

    // Wait for typing animation or response to appear
    await page.waitForTimeout(600);
    const scoutBubbles = await page.$$eval('.bg-white.border.border-slate-200.text-\\[\\#050D2B\\]', els => els.map(e => e.textContent.trim()));
    return scoutBubbles[scoutBubbles.length - 1];
  }

  // 3. Test 'Salt'
  const saltReply = await sendQueryAndGetResponse('Salt');
  console.log('User: "Salt" -> Scout:\n', saltReply);
  const expectedSalt = 'Based on the V12 Engine, Phil Salt is Rank 1 in Batters. They have a Posterior Expected Rank of 11.4 and a 56.6% probability of being in the true top 10 under pressure.';
  const saltPassed = saltReply.includes(expectedSalt);
  console.log(`[CHECK 3] Query 'Salt': ${saltPassed ? 'PASS' : 'FAIL'}`);
  if (!saltPassed) allPassed = false;

  // 4. Test 'top batter'
  const topBatterReply = await sendQueryAndGetResponse('top batter');
  console.log('User: "top batter" -> Scout:\n', topBatterReply);
  const topBatterPassed = topBatterReply.includes('Based on the V12 Engine, Phil Salt is Rank 1 in Batters.');
  console.log(`[CHECK 4] Query 'top batter': ${topBatterPassed ? 'PASS' : 'FAIL'}`);
  if (!topBatterPassed) allPassed = false;

  // 5. Test 'top bowler'
  const topBowlerReply = await sendQueryAndGetResponse('top bowler');
  console.log('User: "top bowler" -> Scout:\n', topBowlerReply);
  const expectedBowler = 'Based on the V12 Engine, Sunil Narine is Rank 1 in Bowlers. They have a Posterior Expected Rank of 11.9 and a 59.9% probability of being in the true top 10 under pressure.';
  const topBowlerPassed = topBowlerReply.includes(expectedBowler);
  console.log(`[CHECK 5] Query 'top bowler': ${topBowlerPassed ? 'PASS' : 'FAIL'}`);
  if (!topBowlerPassed) allPassed = false;

  // 6. Test 'Bumrah'
  const bumrahReply = await sendQueryAndGetResponse('Bumrah');
  console.log('User: "Bumrah" -> Scout:\n', bumrahReply);
  const bumrahPassed = bumrahReply.includes('Based on the V12 Engine, Jasprit Bumrah is Rank 7 in Bowlers.') &&
                       bumrahReply.includes('Posterior Expected Rank of 19.0') &&
                       bumrahReply.includes('35.4%');
  console.log(`[CHECK 6] Query 'Bumrah': ${bumrahPassed ? 'PASS' : 'FAIL'}`);
  if (!bumrahPassed) allPassed = false;

  // 7. Test 'status' / 'hits'
  const statusReply = await sendQueryAndGetResponse('status');
  console.log('User: "status" -> Scout:\n', statusReply);
  const statusPassed = statusReply.includes('Batters [LOW_CONFIDENCE]') &&
                       statusReply.includes('Bowlers [LOW_CONFIDENCE]') &&
                       statusReply.includes('4.7/10') &&
                       statusReply.includes('3.8/10');
  console.log(`[CHECK 7] Query 'status': ${statusPassed ? 'PASS' : 'FAIL'}`);
  if (!statusPassed) allPassed = false;

  // 8. Test Fallback
  const fallbackReply = await sendQueryAndGetResponse('what is the weather today?');
  console.log('User: "what is the weather today?" -> Scout:\n', fallbackReply);
  const expectedFallback = "I am the SupeRR Scout. I only analyze the V12 Posterior Matrix. Ask me about a specific player (e.g., 'Phil Salt') or 'Top Bowler'.";
  const fallbackPassed = fallbackReply.includes(expectedFallback);
  console.log(`[CHECK 8] Fallback message: ${fallbackPassed ? 'PASS' : 'FAIL'}`);
  if (!fallbackPassed) allPassed = false;

  // 9. Verify NO external LLM AI calls made (no openai, generativelanguage, anthropic, api/chat, etc.)
  const externalAPIs = networkRequests.filter(url => 
    url.includes('openai') || 
    url.includes('generativelanguage') || 
    url.includes('anthropic') || 
    url.includes('/api/chat')
  );
  const noExternalAPIs = externalAPIs.length === 0;
  console.log(`[CHECK 9] Zero external LLM APIs called: ${noExternalAPIs ? 'PASS' : 'FAIL'} (${externalAPIs.length} external LLM calls)`);
  if (!noExternalAPIs) allPassed = false;

  // Take screenshot
  await page.screenshot({ path: 'scratch/ask_scout_verification.png', fullPage: false });
  console.log('\nScreenshot saved to scratch/ask_scout_verification.png');

  await browser.close();

  if (allPassed) {
    console.log('\n=== ALL ASK SCOUT LOCAL AGENT AUDIT CHECKS PASSED ===');
    process.exit(0);
  } else {
    console.error('\n=== AUDIT CHECKS FAILED ===');
    process.exit(1);
  }
}

run();
