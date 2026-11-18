export interface ConsensusMeta {
  deliveries_used: number;
  estimator: string;
  ranking_rule: string;
  data_md5: string;
  model_fits: number;
  extras_mode: string;
  expected_hits?: {
    bat?: number;
    bow?: number;
  };
  status?: {
    bat?: string;
    bow?: string;
  };
  status_rule?: string;
  pressure_profile: Array<{
    situation: string;
    deliveries: number;
    avg_leverage: number;
    pct_2nd_innings: number;
    avg_wickets_lost: number;
    avg_balls_left: number;
    avg_required_rate: number;
    pct_powerplay: number;
    pct_middle: number;
    pct_death: number;
  }>;
  squad_fit: {
    available: boolean;
    phase_run_rate?: Record<string, { rate: number; league_rank: number }>;
    phase_economy?: Record<string, { economy: number; league_rank: number }>;
    weakest_bat?: string;
    weakest_bowl?: string;
    candidates?: Array<{
      name: string;
      role: string;
      phase: 'powerplay' | 'middle' | 'death';
      fit_rationale: string;
    }>;
  };
  validation?: any[];
  latent_corr?: number;
}

export interface PlayerRow {
  rank: number;
  id: string | number;
  name: string;
  image?: string | null;
  phase: 'powerplay' | 'middle' | 'death';
  role?: string;
  tier: 'Core' | 'Likely' | 'Bubble' | string;
  expectedRank: number;
  pressureBalls: number;
  pressureInnings: number;
  pressureRating: number;
  ratingInterval: [number, number];
  pTop10Post: number;
  deltaInterval: [number, number];
  deltaIdentified: boolean;
  delta?: number | null;
  baselineRating?: number | null;
  fitStabilityPct?: number | null;
  bootRankInterval?: [number, number] | null;
}

export interface ConsensusDataset {
  meta: ConsensusMeta;
  batters: PlayerRow[];
  bowlers: PlayerRow[];
}
