import fs from 'fs';
const consensusData = JSON.parse(fs.readFileSync('src/data/consensus_frontend.json', 'utf-8'));

function processScoutQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return "I am the SupeRR Scout. I only analyze the V12 Posterior Matrix. Ask me about a specific player (e.g., 'Phil Salt') or 'Top Bowler'.";
  }

  const query = rawQuery.trim().toLowerCase();

  // 1. Check for 'top batter' or 'best batter'
  if (
    query.includes('top batter') || 
    query.includes('best batter') || 
    query.includes('top hitter') || 
    query.includes('best hitter') ||
    query.includes('#1 batter') ||
    query.includes('rank 1 batter')
  ) {
    const topBatter = consensusData.batters.find(b => b.rank === 1) || consensusData.batters[0];
    if (topBatter) {
      return `Based on the V12 Engine, ${topBatter.name} is Rank ${topBatter.rank} in Batters. They have a Posterior Expected Rank of ${Number(topBatter.expectedRank).toFixed(1)} and a ${Number(topBatter.pTop10Post).toFixed(1)}% probability of being in the true top 10 under pressure.`;
    }
  }

  // 2. Check for 'top bowler' or 'best bowler'
  if (
    query.includes('top bowler') || 
    query.includes('best bowler') ||
    query.includes('#1 bowler') ||
    query.includes('rank 1 bowler')
  ) {
    const topBowler = consensusData.bowlers.find(b => b.rank === 1) || consensusData.bowlers[0];
    if (topBowler) {
      return `Based on the V12 Engine, ${topBowler.name} is Rank ${topBowler.rank} in Bowlers. They have a Posterior Expected Rank of ${Number(topBowler.expectedRank).toFixed(1)} and a ${Number(topBowler.pTop10Post).toFixed(1)}% probability of being in the true top 10 under pressure.`;
    }
  }

  // 3. Check for 'status' or 'hits'
  if (
    query.includes('status') || 
    query.includes('hits') || 
    query.includes('hit') ||
    query.includes('validation')
  ) {
    const batStatus = consensusData.meta?.status?.bat ?? 'LOW_CONFIDENCE';
    const bowStatus = consensusData.meta?.status?.bow ?? 'LOW_CONFIDENCE';
    const batHits = consensusData.meta?.expected_hits?.bat !== undefined 
      ? Number(consensusData.meta.expected_hits.bat).toFixed(1) 
      : '4.7';
    const bowHits = consensusData.meta?.expected_hits?.bow !== undefined 
      ? Number(consensusData.meta.expected_hits.bow).toFixed(1) 
      : '3.8';

    return `Model Status: Batters [${batStatus}], Bowlers [${bowStatus}]. Expected True Hits: ${batHits}/10 for Batters and ${bowHits}/10 for Bowlers.`;
  }

  // 4. Check for player names in Batters & Bowlers
  const cleanQ = query.replace(/[^a-z0-9 ]/g, ' ');

  const matchedBatter = consensusData.batters.find(p => {
    const pName = p.name.toLowerCase();
    if (cleanQ.includes(pName)) return true;
    const pParts = pName.split(/\s+/);
    return pParts.some(part => part.length >= 3 && cleanQ.includes(part));
  });

  if (matchedBatter) {
    return `Based on the V12 Engine, ${matchedBatter.name} is Rank ${matchedBatter.rank} in Batters. They have a Posterior Expected Rank of ${Number(matchedBatter.expectedRank).toFixed(1)} and a ${Number(matchedBatter.pTop10Post).toFixed(1)}% probability of being in the true top 10 under pressure.`;
  }

  const matchedBowler = consensusData.bowlers.find(p => {
    const pName = p.name.toLowerCase();
    if (cleanQ.includes(pName)) return true;
    const pParts = pName.split(/\s+/);
    return pParts.some(part => part.length >= 3 && cleanQ.includes(part));
  });

  if (matchedBowler) {
    return `Based on the V12 Engine, ${matchedBowler.name} is Rank ${matchedBowler.rank} in Bowlers. They have a Posterior Expected Rank of ${Number(matchedBowler.expectedRank).toFixed(1)} and a ${Number(matchedBowler.pTop10Post).toFixed(1)}% probability of being in the true top 10 under pressure.`;
  }

  return "I am the SupeRR Scout. I only analyze the V12 Posterior Matrix. Ask me about a specific player (e.g., 'Phil Salt') or 'Top Bowler'.";
}

const queries = ['Salt', 'narine', 'Bumrah', 'top batter', 'best batter', 'top bowler', 'status', 'hits', 'random test'];
for (const q of queries) {
  console.log(`Q: "${q}" -> A:\n   ${processScoutQuery(q)}\n`);
}
