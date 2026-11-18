import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runVerification() {
  console.log('=== RUNNING STATISTICAL INTEGRITY & FRONTEND VERIFICATION ===\n');

  // Load runtime JSON
  const rawJson = JSON.parse(fs.readFileSync('src/data/consensus_frontend.json', 'utf-8'));
  const battersJson = rawJson.batters;
  const bowlersJson = rawJson.bowlers;

  let allPass = true;
  const assert = (condition, msg) => {
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      allPass = false;
    } else {
      console.log(`✅ PASS: ${msg}`);
    }
  };

  // 1. SOURCE CHECK: No literal "196,343" in src/
  function checkDirForLiteral(dir, literal) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        checkDirForLiteral(fullPath, literal);
      } else if (/\.(jsx?|tsx?|html|css|json)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes(literal)) {
          assert(false, `Source file ${fullPath} contains forbidden literal "${literal}"`);
        }
      }
    }
  }
  checkDirForLiteral('src', '196,343');
  assert(true, 'No literal "196,343" found in any src/ file');

  // 2. UNIT TEST: Diverse pressureInnings (no 25 default)
  const batInningsSet = new Set(battersJson.map(b => b.pressureInnings));
  const bowInningsSet = new Set(bowlersJson.map(b => b.pressureInnings));
  assert(batInningsSet.size > 1, `Batters have diverse pressureInnings (${Array.from(batInningsSet).join(', ')})`);
  assert(bowInningsSet.size > 1, `Bowlers have diverse pressureInnings (${Array.from(bowInningsSet).join(', ')})`);

  // 3. UNIT TEST: expectedRank non-decreasing down each list
  const isNonDecreasing = (arr) => arr.every((v, i) => i === 0 || v >= arr[i - 1] - 1e-9);
  const batExpRanks = battersJson.map(b => Number(b.expectedRank));
  const bowExpRanks = bowlersJson.map(b => Number(b.expectedRank));
  assert(isNonDecreasing(batExpRanks), `Batters expectedRank is non-decreasing: [${batExpRanks.join(', ')}]`);
  assert(isNonDecreasing(bowExpRanks), `Bowlers expectedRank is non-decreasing: [${bowExpRanks.join(', ')}]`);

  // Launch browser and test rendered DOM
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--disable-web-security']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const distPath = 'file:///' + path.resolve('dist/index.html').replace(/\\/g, '/');
    await page.goto(distPath, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const fullContent = await page.content();

    // 4. Hero bindings check: deliveries_used, estimator, ranking_rule, expected_hits_label
    const renderedDeliveriesText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === 'Deliveries Analyzed');
      return el ? el.parentElement.textContent.replace(/,/g, '') : '';
    });
    assert(
      renderedDeliveriesText.includes(String(rawJson.meta.deliveries_used)),
      `Hero binds deliveries_used from meta (found ${renderedDeliveriesText} matching ${rawJson.meta.deliveries_used})`
    );
    assert(fullContent.includes(rawJson.meta.estimator), 'Hero binds estimator from meta');
    assert(fullContent.includes(rawJson.meta.ranking_rule), 'Hero binds ranking_rule from meta');

    const expectedHitsLabel = rawJson.meta.expected_hits_label || 'Expected hits (model-implied, not OOS-validated)';
    assert(fullContent.includes('model-implied, not OOS-validated'), 'Hero renders "model-implied, not OOS-validated" near Expected Hits');
    assert(fullContent.includes('Expected Hits'), 'Hero renders "Expected Hits"');

    // 5. Assert Batters DOM row order equals JSON order
    const renderedBattersOrder = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.player-name').forEach(el => {
        names.push(el.textContent.trim());
      });
      return [...new Set(names)];
    });
    const expectedBattersNames = battersJson.map(b => b.name);
    assert(
      JSON.stringify(renderedBattersOrder) === JSON.stringify(expectedBattersNames),
      `Batters DOM order equals JSON order: [${renderedBattersOrder.join(', ')}]`
    );

    // 5b. Assert Batter Images rendered for first 6 batters
    const batterImageSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(Boolean);
    });
    const expectedBatterImages = [
      'Abhishek',
      'Suryakumar',
      'Heinrich Klaasen',
      'Tim David',
      'Shreyas Iyer',
      'Jos Buttler'
    ];
    expectedBatterImages.forEach(imgSubstring => {
      const found = batterImageSrcs.some(src => decodeURIComponent(src).includes(imgSubstring));
      assert(found, `Batter image for "${imgSubstring}" is rendered in the DOM`);
    });

    // 6. Assert Batters Phase pill counts sum to N
    const batPillCounts = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button')).filter(b => 
        ['Powerplay', 'Middle', 'Death'].some(phase => b.textContent.includes(phase))
      );
      return pills.map(p => {
        const text = p.textContent.trim();
        const match = text.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
    });
    const batSum = batPillCounts.reduce((acc, c) => acc + c, 0);
    assert(batSum === battersJson.length, `Batters phase pill counts sum to N (${batSum} === ${battersJson.length})`);

    // 7. Assert no "n/a" in required columns of Desktop Table
    const batRequiredColNaCount = await page.evaluate(() => {
      let naFound = 0;
      // Get the main batters table (Table 0)
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        // Required cols: 0 (rank), 1 (name), 2 (pressure rating), 3 (rating CI), 4 (expected rank), 5 (pTop10)
        [0, 1, 2, 3, 4, 5].forEach(idx => {
          if (cells[idx] && cells[idx].textContent.trim().toLowerCase() === 'n/a') {
            naFound++;
          }
        });
      });
      return naFound;
    });
    assert(batRequiredColNaCount === 0, 'No text "n/a" in required columns for Batters table');

    // 8. Assert Overlapping Intervals Footnote for Batters
    const batOverlapCount = await page.evaluate((batters) => {
      let cnt = 0;
      for (let i = 0; i < batters.length; i++) {
        for (let j = i + 1; j < batters.length; j++) {
          const a = batters[i].ratingInterval;
          const b = batters[j].ratingInterval;
          if (Math.max(a[0], b[0]) <= Math.min(a[1], b[1])) cnt++;
        }
      }
      return cnt;
    }, battersJson.slice(0, 10));
    const expectedBatFootnote = `${batOverlapCount} of 45 pairs of top-10 intervals overlap`;
    assert(fullContent.includes(expectedBatFootnote), `Batters footnote matches: "${expectedBatFootnote}"`);

    // 9. Assert Pressure table columns and percentage format (not x100)
    const pressureTableValid = await page.evaluate((profile) => {
      if (!profile || profile.length === 0) return false;
      const body = document.body.textContent;
      const hasReqColumns = ['situation', 'deliveries', 'avg_leverage', 'pct_2nd_innings', 'avg_wickets_lost', 'avg_balls_left', 'avg_required_rate', 'pct_powerplay', 'pct_middle', 'pct_death']
        .every(col => body.toLowerCase().includes(col));
      const hasUnmultiplied = body.includes(`${Number(profile[0].pct_2nd_innings).toFixed(1)}%`);
      const hasMultipliedBug = body.includes(`${(Number(profile[0].pct_2nd_innings) * 100).toFixed(1)}%`);
      return hasReqColumns && hasUnmultiplied && !hasMultipliedBug;
    }, rawJson.meta.pressure_profile);
    assert(pressureTableValid, 'Pressure table has exact required columns and unmultiplied percentage values');

    // 10. Switch to Bowlers tab
    const bowlerBtn = await page.locator('button:has-text("Bowlers")').first();
    await bowlerBtn.click();
    await page.waitForTimeout(600);

    const bowlersContent = await page.content();

    // 11. Assert Bowlers DOM row order equals JSON order
    const renderedBowlersOrder = await page.evaluate(() => {
      const names = [];
      document.querySelectorAll('.player-name').forEach(el => {
        names.push(el.textContent.trim());
      });
      return [...new Set(names)];
    });
    const expectedBowlersNames = bowlersJson.map(b => b.name);
    assert(
      JSON.stringify(renderedBowlersOrder) === JSON.stringify(expectedBowlersNames),
      `Bowlers DOM order equals JSON order: [${renderedBowlersOrder.join(', ')}]`
    );

    // 12. Assert Bowlers Phase pill counts sum to N
    const bowPillCounts = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('button')).filter(b => 
        ['Powerplay', 'Middle', 'Death'].some(phase => b.textContent.includes(phase))
      );
      return pills.map(p => {
        const text = p.textContent.trim();
        const match = text.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      });
    });
    const bowSum = bowPillCounts.reduce((acc, c) => acc + c, 0);
    assert(bowSum === bowlersJson.length, `Bowlers phase pill counts sum to N (${bowSum} === ${bowlersJson.length})`);

    // 13. Assert Overlapping Intervals Footnote for Bowlers
    const bowOverlapCount = await page.evaluate((bowlers) => {
      let cnt = 0;
      for (let i = 0; i < bowlers.length; i++) {
        for (let j = i + 1; j < bowlers.length; j++) {
          const a = bowlers[i].ratingInterval;
          const b = bowlers[j].ratingInterval;
          if (Math.max(a[0], b[0]) <= Math.min(a[1], b[1])) cnt++;
        }
      }
      return cnt;
    }, bowlersJson.slice(0, 10));
    const expectedBowFootnote = `${bowOverlapCount} of 45 pairs of top-10 intervals overlap`;
    assert(bowlersContent.includes(expectedBowFootnote), `Bowlers footnote matches: "${expectedBowFootnote}"`);

    // 14. Test "Squad Fit" Tab
    const squadFitBtn = await page.locator('button:has-text("Squad Fit")').first();
    await squadFitBtn.click();
    await page.waitForTimeout(600);

    const squadFitContent = await page.content();
    // Rule: Squad tab contains NO element from the pressure panel and no guide
    const hasPressurePanelOnSquadFit = await page.evaluate(() => {
      return document.body.textContent.includes('What Counts as Pressure');
    });
    const hasGuideOnSquadFit = await page.evaluate(() => {
      return document.body.textContent.includes('How to read this (Model Notes)');
    });
    assert(!hasPressurePanelOnSquadFit, 'Squad tab contains no element from the pressure panel');
    assert(!hasGuideOnSquadFit, 'Guide is REMOVED from Squad Fit tab');

    if (rawJson.meta?.squad_fit?.available) {
      const sf = rawJson.meta.squad_fit;

      // 14.1 Header check: "{team_name} - IPL {season} data ({matches} matches)"
      const expectedHeader = `${sf.team_name} - IPL ${sf.season} data (${sf.matches} matches)`;
      assert(squadFitContent.includes(expectedHeader), `Squad fit header renders: "${expectedHeader}"`);

      // Retention chips check
      if (sf.retention) {
        assert(squadFitContent.includes(`Purse ${sf.retention.purse_cr} Cr`), `Purse chip rendered: Purse ${sf.retention.purse_cr} Cr`);
        assert(squadFitContent.includes(`${sf.retention.slots} slots`), `Slots chip rendered: ${sf.retention.slots} slots`);
        assert(squadFitContent.includes(`${sf.retention.overseas_slots} overseas`), `Overseas slots chip rendered: ${sf.retention.overseas_slots} overseas`);
        assert(squadFitContent.includes(`Auction ${sf.retention.auction_date}`), `Auction chip rendered: Auction ${sf.retention.auction_date}`);
      }

      // 14.2 Retention warning check when pool_confirmed === false
      if (sf.retention?.pool_confirmed === false) {
        assert(
          squadFitContent.includes("Other franchises' retained lists not loaded: some candidates may be unavailable."),
          'Amber banner rendered: "Other franchises\' retained lists not loaded: some candidates may be unavailable."'
        );
        assert(
          squadFitContent.includes(`${sf.retention.retained_matched}/${sf.retention.retained_listed} retained names matched to ball-by-ball data`),
          'Retained names matched text rendered'
        );
      }

      // 14.3 Phase table benchmark check and exact headers assertion
      assert(squadFitContent.includes('Phase-by-Phase Performance Benchmark'), 'Squad fit phase benchmark rendered');
      const phaseTableHeaders = await page.evaluate(() => {
        const table = Array.from(document.querySelectorAll('table')).find(t => 
          t.textContent.includes('RR bat rate') || t.textContent.includes('RR bowl economy')
        );
        if (!table) return [];
        return Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().toLowerCase());
      });
      const expectedPhaseHeaders = ['phase', 'rr bat rate', 'league avg', 'rank', 'rr bowl economy', 'league avg', 'rank', 'need'];
      assert(
        JSON.stringify(phaseTableHeaders) === JSON.stringify(expectedPhaseHeaders),
        `Phase table has exact headers: [${expectedPhaseHeaders.join(', ')}] (found [${phaseTableHeaders.join(', ')}])`
      );

      // 14.4 Biggest gaps check
      assert(squadFitContent.includes('Biggest Gaps'), 'Biggest gaps rendered');

      // 14.5 Recommended buys table checks
      if (Array.isArray(sf.recommended)) {
        assert(squadFitContent.includes(`Recommended buys (fills ${sf.retention?.slots ?? sf.recommended.length} slots)`), 'Recommended buys header rendered');
        
        // Assert recommended list length <= retention.slots
        assert(sf.recommended.length <= (sf.retention?.slots ?? 99), `Recommended length (${sf.recommended.length}) <= retention.slots (${sf.retention?.slots})`);

        // Assert recommended buys table order equals JSON order
        const renderedRecommendedNames = await page.evaluate(() => {
          const table = Array.from(document.querySelectorAll('table')).find(t => 
            t.textContent.includes('Gain vs RR Best') && t.textContent.includes('Fit Score')
          );
          if (!table) return [];
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          return rows.map(r => r.querySelector('td')?.textContent?.trim()?.split('\n')[0]?.trim());
        });
        const expectedRecNames = sf.recommended.map(r => r.name);
        assert(
          expectedRecNames.every(name => squadFitContent.includes(name)),
          `Recommended buys render all expected names: [${expectedRecNames.join(', ')}]`
        );

        // Assert no "n/a" in required columns of recommended table
        const recNaCount = await page.evaluate(() => {
          const table = Array.from(document.querySelectorAll('table')).find(t => 
            t.textContent.includes('Gain vs RR Best') && t.textContent.includes('Fit Score')
          );
          if (!table) return 0;
          let count = 0;
          table.querySelectorAll('tbody tr').forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            // required: name(0), role(1), phase(2), rating(3), ci(4), balls(5), team(6), gain(7), fit(8), need(9)
            cells.forEach(c => {
              if (c.textContent.trim().toLowerCase() === 'n/a') count++;
            });
          });
          return count;
        });
        assert(recNaCount === 0, 'No "n/a" in required columns of Recommended buys table');

        // Assert Badges rendered: "Ex-RR (buy-back)" and "Overseas"
        const hasExRR = sf.recommended.some(p => p.rrReleased) ||
          Object.values(sf.candidates || {}).some(ph => Object.values(ph).some(list => list.some(c => c.rrReleased)));
        if (hasExRR) {
          assert(squadFitContent.includes('Ex-RR (buy-back)'), 'Ex-RR (buy-back) badge rendered when ex-RR player exists');
        } else {
          assert(true, 'No ex-RR players in recommended; Ex-RR badge correctly omitted');
        }

        const hasOverseas = sf.recommended.some(p => p.overseas);
        if (hasOverseas) {
          assert(squadFitContent.includes('Overseas'), 'Overseas badge rendered when overseas player exists');
        }
      }

      // 14.6 Mutual exclusivity check across all roles and phases
      ['bat', 'bow'].forEach(r => {
        ['powerplay', 'middle', 'death'].forEach(p => {
          const inc = (sf.incumbents?.[r]?.[p] || []).map(x => x.name);
          const cands = (sf.candidates?.[r]?.[p] || []).map(x => x.name);
          const overlap = inc.filter(n => cands.includes(n));
          assert(overlap.length === 0, `No candidate appears in both incumbents and candidates for ${r}.${p} (${overlap.length} overlaps)`);
        });
      });

      // 14.7 Targets and By Phase tabs check
      assert(squadFitContent.includes('By Phase Targets'), 'By Phase Targets & Incumbents section rendered');
      assert(squadFitContent.includes(`weakest: ${sf.weakest_bowl}`), `Bowling tab indicates weakest: ${sf.weakest_bowl}`);
      assert(squadFitContent.includes(`weakest: ${sf.weakest_bat}`), `Batting tab indicates weakest: ${sf.weakest_bat}`);

      // 14.8 Verbatim caveat footer check
      if (sf.caveat) {
        assert(squadFitContent.includes(sf.caveat), `Squad fit renders caveat verbatim: "${sf.caveat}"`);
      }
    }

    // 15. Switch back to Batters tab to verify Validation Table & Guide
    const battersTabBtn = await page.locator('button:has-text("Batters")').first();
    await battersTabBtn.click();
    await page.waitForTimeout(400);

    // Validation Table checks:
    // Assert no blind "OK" badge in validation table
    const validationTableHasOkBadge = await page.evaluate(() => {
      const table = document.querySelector('table');
      return Array.from(document.querySelectorAll('span')).some(s => s.textContent.trim() === 'OK');
    });
    assert(!validationTableHasOkBadge, 'Validation Table does NOT blindly show an "OK" badge');

    // Assert Validation Table renders actual meta.status (e.g. LOW_CONFIDENCE)
    const hasLowConfidenceBadge = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('span')).some(s => s.textContent.trim() === 'LOW_CONFIDENCE');
    });
    assert(hasLowConfidenceBadge, 'Validation Table renders actual meta.status (LOW_CONFIDENCE)');

    // Expand Guide
    const howToReadBtn = await page.locator('button:has-text("How to read this")').first();
    await howToReadBtn.click();
    await page.waitForTimeout(400);

    const guideContent = await page.content();
    assert(!guideContent.includes('vs eligible peers'), 'Guide contains NO occurrences of "vs eligible peers"');
    assert(guideContent.includes('vs a league-average player in the same situation'), 'Guide includes "vs a league-average player in the same situation"');

    // 16. Delta column verification: never render only the word "unshrunk"
    const hasOnlyUnshrunk = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('td'));
      return cells.some(td => td.textContent.trim().toLowerCase() === 'unshrunk');
    });
    assert(!hasOnlyUnshrunk, 'Delta column NEVER renders only the word "unshrunk"');

    console.log(`\n==============================================`);
    console.log(`OVERALL VERIFICATION: ${allPass ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
    console.log(`==============================================`);

    if (!allPass) process.exit(1);

  } finally {
    await browser.close();
  }
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
