import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // Initialize Gemini AI Client if API key is present
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }

  // Scouting Agent AI Chat API
  app.post('/api/chat', async (req, res) => {
    console.log('Incoming chat query:', req.body?.query);
    const { query, messages } = req.body || {};

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // If Gemini API is available, query Gemini 3.8 Flash
    if (ai) {
      try {
        const systemPrompt = `You are the Expert Scouting Agent for Rajasthan Royals (RR) cricket franchise.
You analyze T20 cricket players using our advanced Python Machine Learning model (ml_model/supeRR_clustering_pipeline.py) evaluated on 200,999 delivery-level records across 867 IPL and T20I matches (2022-2026).
Crucial methodology note: We solved the "Low Baseline Trap" by filtering for players with genuine elevation (Multiplier >= 1.20x for batters, >= 1.15x for bowlers) and strictly requiring positive Value Over Replacement (xRuns > 0, xWickets > 0). Players with negative xRuns (such as Wesley Madhevere at -26.7) are eliminated.

Top 10 Batters (Ranked by Value Over Replacement under pressure):
1. Shashank Singh (+101.2 xRuns, 185.6 SR, 43.4 Avg, 1.32x Multiplier, Cluster 2: Versatile Finisher)
2. Rishabh Pant (+93.8 xRuns, 179.2 SR, 28.4 Avg, 1.20x Multiplier, Cluster 0: Chase Anchor)
3. Donovan Ferreira (+65.0 xRuns, 183.4 SR, 28.4 Avg, 1.30x Multiplier, Cluster 0: Chase Anchor)
4. Quinton de Kock (+60.9 xRuns, 162.9 SR, 34.1 Avg, 1.22x Multiplier, Cluster 0: Chase Anchor)
5. Asif Khan (+35.8 xRuns, 188.8 SR, 33.7 Avg, 1.52x Multiplier, Cluster 2: Versatile Finisher)
6. Cooper Connolly (+31.8 xRuns, 173.6 SR, 36.2 Avg, 1.34x Multiplier, Cluster 0: Chase Anchor)
7. Rachin Ravindra (+30.5 xRuns, 156.3 SR, 25.6 Avg, 1.22x Multiplier, Cluster 0: Chase Anchor)
8. Babar Azam (+29.8 xRuns, 159.8 SR, 37.2 Avg, 1.28x Multiplier, Cluster 0: Chase Anchor)
9. Najibullah Zadran (+27.0 xRuns, 183.8 SR, 43.5 Avg, 2.04x Multiplier, Cluster 1: Death Disruptor)
10. Ramandeep Singh (+23.0 xRuns, 175.4 SR, 25.2 Avg, 1.30x Multiplier, Cluster 0: Chase Anchor)

Top 10 Bowlers (Ranked by Wickets Over Replacement under pressure):
1. Mitchell Starc (+14.5 xWkts, 1.71x Multiplier, 39 wickets, 9.77 economy in death & pressure)
2. Jamie Overton (+10.0 xWkts, 1.59x Multiplier, 25 wickets, 9.57 economy)
3. Ben Dwarshuis (+5.7 xWkts, 1.58x Multiplier, 15 wickets, 10.02 economy)
4. Mark Wood (+5.5 xWkts, 1.23x Multiplier, 15 wickets, 8.81 economy)
5. Anshul Kamboj (+4.2 xWkts, 1.46x Multiplier, 22 wickets, 10.54 economy)
6. Odean Smith (+4.1 xWkts, 1.30x Multiplier, 18 wickets, 11.25 economy)
7. Luke Wood (+3.8 xWkts, 1.58x Multiplier, 12 wickets, 11.76 economy)
8. Akeal Hosein (+3.6 xWkts, 1.20x Multiplier, 25 wickets, 9.07 economy)
9. Shaheen Afridi (+3.4 xWkts, 1.24x Multiplier, 35 wickets, 8.60 economy)
10. Hasan Mahmud (+3.3 xWkts, 1.53x Multiplier, 15 wickets, 8.53 economy)

Methodology:
- Batting Performance Index: BPI = SR * Avg; Elevation = BPI_pres / BPI_base.
- Value Over Replacement (xRuns / xWickets): Over-by-over delta compared to historical mean per over.
- K-Means Clustering (n_clusters=3): Cluster 0 (Chase Anchors), Cluster 1 (Death Disruptors), Cluster 2 (Versatile Finishers).
- Bowling Performance Index: Bowl_Index = 1000 / (Economy * Bowl_SR); Elevation = Bowl_Index_pres / Bowl_Index_base.
- Pressure Situations: Steep chases (RRR >= 10.5 in inn 2), top-order collapse (<=6 ov, >=3 wkts down), death overs (>=16 ov), defending close totals (<=50 runs in death), and partnership breakers (50+ stand or batter on 35+).
Tone: Elite sports analytics director for Rajasthan Royals, sharp, data-driven, confident, actionable.`;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 2500)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${systemPrompt}\n\nUser Question: ${query}`,
          }),
          timeoutPromise,
        ]);

        if (response?.text) {
          return res.json({ reply: response.text });
        }
      } catch (err: any) {
        console.error('Gemini API call failed, falling back to heuristic scouting logic:', err?.message || err);
      }
    }

    // Heuristic response if Gemini API key is absent or offline
    const qLower = (query || '').toLowerCase();
    if (qLower.includes('mvp') || qLower.includes('all rounder') || qLower.includes('narine')) {
      return res.json({
        reply: "For the MVP category, we filtered players who met the 150-ball pressure baseline in BOTH batting and bowling. Sunil Narine tops this because his combined xRuns (+18.5) and xWickets (+5.2) under pressure create the highest total Value Over Replacement in T20s!"
      });
    }

    if (qLower.includes('qoo') || qLower.includes('opposition') || qLower.includes('bumrah')) {
      return res.json({
        reply: "Our Quality of Opposition (QoO) multiplier scales runs based on the bowler's career economy. Scoring against express elite bowlers like Jasprit Bumrah carries up to 2.0x weightage, ensuring batters aren't rewarded for easy stat-padding against part-timers."
      });
    }

    if (qLower.includes('dew') || qLower.includes('wicket index') || qLower.includes('tailender')) {
      return res.json({
        reply: "Our Wicket Value Index assigns 1.5x weight to top 4 wickets and discounts tailenders (7-10) to 0.5x. Plus, 2nd innings bowling receives a +1.2x Dew Factor multiplier to compensate for the extreme grip loss when defending tight totals under night dew."
      });
    }

    if (qLower.includes('venue') || qLower.includes('pitch') || qLower.includes('chepauk') || qLower.includes('chinnaswamy')) {
      return res.json({
        reply: "The Venue Difficulty Index adjusts xRuns based on stadium run-scoring history. Scoring in low-scoring chases at Chepauk (MA Chidambaram) or Ekana carries significantly higher clutch value than at high-altitude batting tracks like Chinnaswamy."
      });
    }

    if (qLower.includes('clutch freq') || qLower.includes('frequency') || qLower.includes('consistency')) {
      return res.json({
        reply: "The Strict > 45% Clutch Frequency filter mandates that a player must produce positive Value Over Replacement (+xRuns/+xWickets) in at least 45% of their pressure appearances, effectively eliminating 'one-hit wonders' (such as Vijay Shankar and Romario Shepherd)!"
      });
    }

    if (qLower.includes('shashank') || qLower.includes('batter') || qLower.includes('hitters')) {
      return res.json({
        reply: "Shashank Singh is our #1 Batter with +116.4 QoO-adjusted xRuns and a 54.5% Clutch Frequency. The model caught this because we filtered for extreme situations like RRR >= 10.5 and top-order collapses. He single-handedly adds massive value when the team is struggling."
      });
    }

    if (qLower.includes('starc') || qLower.includes('bowler')) {
      return res.json({
        reply: "Mitchell Starc is our #1 Bowler with a 1.71x Multiplier and +6.9 Dew & Wicket-adjusted xWickets (54.5% Clutch Freq). His ability to execute yorkers in the death overs (16-20) when defending tight totals makes him an invaluable tier-1 pressure asset."
      });
    }

    if (qLower.includes('methodology') || qLower.includes('pressure') || qLower.includes('multiplier')) {
      return res.json({
        reply: "Our V4.0 Ultimate methodology uses dynamic match contexts: Steep Chases (RRR >= 10.5), Powerplay Collapses (3+ wickets lost), and Death Overs. The 'Pressure Elevation Multiplier' compares their baseline performance to their performance in these specific clutch moments, calibrated by QoO, Venue Difficulty, Dew, and a Strict > 45% Clutch Frequency."
      });
    }

    return res.json({
      reply: "Great question! Our V4.0 Ultimate Clutch Pipeline evaluates 200,999 deliveries with QoO, Venue, Dew, Wicket-Index, and Strict > 45% Clutch Frequency. You can ask me about our MVPs, Top Batters like Shashank Singh, or Top Bowlers like Mitchell Starc!"
    });
  });

  // API endpoint for raw dossier data
  app.get('/api/dossier/meta', (req, res) => {
    res.json({
      name: 'SupeRR Selector: The Clutch Dossier',
      franchise: 'Rajasthan Royals',
      season: '2025/2026',
      totalBallsAnalyzed: 12480,
      version: '2.4.1'
    });
  });

  // Direct ZIP download endpoint
  app.get(['/api/download-zip', '/download-codebase.zip'], (req, res) => {
    const zipPath = path.join(__dirname, 'public', 'superr-selector-codebase.zip');
    res.download(zipPath, 'superr-selector-codebase.zip', (err) => {
      if (err) {
        console.error('Error downloading zip:', err);
        res.status(500).send('Error delivering codebase zip');
      }
    });
  });

  // Mount Vite middlewares in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SupeRR Selector server running at http://localhost:${PORT}`);
  });
}

startServer();
