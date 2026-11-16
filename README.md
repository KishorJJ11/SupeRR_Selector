# SupeRR Selector: The Clutch Dossier 🏏
**Rajasthan Royals (RR) T20 Pressure Analytics & Machine Learning Scouting Suite**

A production-ready full-stack application built for the Rajasthan Royals franchise to evaluate player performance under extreme match pressure.

---

## 🚀 How to Run in VS Code

### 1. Extract the ZIP
Extract the contents of `superr-selector-codebase.zip` into your chosen folder and open it in VS Code:
```bash
code .
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🛠 Tech Stack
- **Frontend**: React 19 (JSX), Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide React
- **Backend**: Node.js + Express (`server.ts`) with Gemini 3.8 Flash Scouting Agent integration
- **ML & Data Engine**: Python 3 script (`ml_model/supeRR_pressure_model.py`) for ball-by-ball win probability and Pressure Elevation Multiplier (PEI)

---

## 📁 Codebase Structure
```
├── ml_model/
│   └── supeRR_pressure_model.py     # Python ML Pressure Engine & PEI calculations
├── src/
│   ├── components/
│   │   ├── Header.jsx               # RR Logo, Tab navigation, and Action buttons
│   │   ├── HittersView.jsx          # Top 3 Podium Cards & Top 10 Batters Table
│   │   ├── BowlersView.jsx          # Bowler Cards, Phase Breakdown & Roster
│   │   ├── TacticalMatchupView.jsx  # Pace vs Spin SR Matrix & Laurel Wreaths
│   │   ├── PlayerModal.jsx          # Deep-dive clutch breakdown modal
│   │   ├── ScoutChatWidget.jsx      # AI Scouting Agent ("Ask the SupeRR Scout")
│   │   ├── RajasthanRoyalsLogo.jsx  # Vector RR emblem with crown & lions
│   │   ├── MethodologyModal.jsx     # ML formula & RRR threshold explanation
│   │   └── ZipExporterModal.jsx     # In-app Codebase ZIP Exporter
│   ├── data/
│   │   └── cricketData.js           # Full T20 clutch dataset & Scout QA engine
│   ├── App.jsx                      # Root container with RR glassmorphism layout
│   ├── index.css                    # Tailwind CSS v4 and RR theme variables
│   └── main.jsx                     # Application bootstrap
├── index.html                       # HTML5 entry with Outfit & Plus Jakarta fonts
├── package.json                     # Dependencies & build scripts
├── server.ts                        # Express backend + Vite dev middleware
├── tsconfig.json                    # TS/JSX compiler configuration
└── vite.config.ts                   # Vite configuration
```
