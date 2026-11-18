/**
 * Schema Contract Validator for consensus_frontend.json
 * Implements a Zod-equivalent schema validation contract.
 *
 * Rules:
 * - REQUIRED keys cannot be undefined, null, or invalid type.
 * - If any REQUIRED key is missing, validateConsensusData returns isValid: false with missingKeys list.
 * - Optional keys are permitted to be absent, null, or fallback to "n/a".
 */

export const REQUIRED_ROOT_KEYS = ['meta', 'batters', 'bowlers'];

export const REQUIRED_META_KEYS = [
  'deliveries_used',
  'estimator',
  'ranking_rule',
  'data_md5',
  'model_fits',
  'extras_mode',
  'pressure_profile',
  'squad_fit'
];

export const REQUIRED_PRESSURE_COLUMNS = [
  'situation',
  'deliveries',
  'avg_leverage',
  'pct_2nd_innings',
  'avg_wickets_lost',
  'avg_balls_left',
  'avg_required_rate',
  'pct_powerplay',
  'pct_middle',
  'pct_death'
];

export const REQUIRED_SQUAD_FIT_RETENTION_KEYS = [
  'purse_cr',
  'slots',
  'overseas_slots',
  'auction_date',
  'source',
  'pool_confirmed'
];

export const REQUIRED_RECOMMENDED_KEYS = [
  'name',
  'role',
  'phase',
  'rating',
  'pressureBalls',
  'lastIplTeam',
  'gainVsRRBest',
  'fitScore',
  'gapNeed'
];

export const REQUIRED_PLAYER_FIELDS = [
  'rank',
  'id',
  'name',
  'phase',
  'tier',
  'expectedRank',
  'pressureBalls',
  'pressureInnings',
  'pressureRating',
  'ratingInterval',
  'pTop10Post',
  'deltaInterval',
  'deltaIdentified'
];

export const VALID_PHASES = ['powerplay', 'middle', 'death'];
export const VALID_TIERS = ['Core', 'Likely', 'Bubble'];

export function validateConsensusData(data) {
  const missingKeys = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      missingKeys: ['root (payload must be a valid JSON object)']
    };
  }

  // 1. Root Keys Check
  for (const key of REQUIRED_ROOT_KEYS) {
    if (data[key] === undefined || data[key] === null) {
      missingKeys.push(key);
    }
  }

  // 2. Meta Keys Check
  if (data.meta && typeof data.meta === 'object') {
    for (const key of REQUIRED_META_KEYS) {
      if (data.meta[key] === undefined || data.meta[key] === null) {
        missingKeys.push(`meta.${key}`);
      }
    }

    // Pressure profile rows
    if (Array.isArray(data.meta.pressure_profile)) {
      if (data.meta.pressure_profile.length === 0) {
        missingKeys.push('meta.pressure_profile (must not be empty)');
      } else {
        data.meta.pressure_profile.forEach((row, idx) => {
          for (const col of REQUIRED_PRESSURE_COLUMNS) {
            if (row[col] === undefined || row[col] === null) {
              missingKeys.push(`meta.pressure_profile[${idx}].${col}`);
            }
          }
        });
      }
    }

    // Squad fit object
    if (data.meta.squad_fit && typeof data.meta.squad_fit === 'object') {
      if (typeof data.meta.squad_fit.available !== 'boolean') {
        missingKeys.push('meta.squad_fit.available');
      } else if (data.meta.squad_fit.available) {
        // Check retention
        if (!data.meta.squad_fit.retention || typeof data.meta.squad_fit.retention !== 'object') {
          missingKeys.push('meta.squad_fit.retention');
        } else {
          for (const key of REQUIRED_SQUAD_FIT_RETENTION_KEYS) {
            if (data.meta.squad_fit.retention[key] === undefined || data.meta.squad_fit.retention[key] === null) {
              missingKeys.push(`meta.squad_fit.retention.${key}`);
            }
          }
        }

        // Check recommended
        if (!Array.isArray(data.meta.squad_fit.recommended)) {
          missingKeys.push('meta.squad_fit.recommended');
        } else {
          const slots = data.meta.squad_fit.retention?.slots ?? 0;
          if (data.meta.squad_fit.recommended.length > slots) {
            missingKeys.push(`meta.squad_fit.recommended (length ${data.meta.squad_fit.recommended.length} exceeds retention.slots ${slots})`);
          }
          data.meta.squad_fit.recommended.forEach((rec, idx) => {
            for (const key of REQUIRED_RECOMMENDED_KEYS) {
              if (rec[key] === undefined || rec[key] === null) {
                missingKeys.push(`meta.squad_fit.recommended[${idx}].${key}`);
              }
            }
          });
        }

        // Mutual exclusivity: no candidate in incumbents for same role+phase
        if (data.meta.squad_fit.incumbents && data.meta.squad_fit.candidates) {
          ['bow', 'bat'].forEach(role => {
            ['powerplay', 'middle', 'death'].forEach(phase => {
              const incNames = (data.meta.squad_fit.incumbents[role]?.[phase] || []).map(p => p.name);
              const candNames = (data.meta.squad_fit.candidates[role]?.[phase] || []).map(p => p.name);
              const overlap = incNames.filter(n => candNames.includes(n));
              if (overlap.length > 0) {
                missingKeys.push(`meta.squad_fit mutual exclusivity violated in ${role}.${phase}: ${overlap.join(', ')}`);
              }
            });
          });
        }
      }
    }
  }

  // 3. Batters & Bowlers Player Arrays Check
  const validatePlayerList = (players, listName) => {
    if (!Array.isArray(players) || players.length === 0) {
      missingKeys.push(`${listName} (must be a non-empty list)`);
      return;
    }

    players.forEach((player, idx) => {
      for (const field of REQUIRED_PLAYER_FIELDS) {
        if (player[field] === undefined || player[field] === null) {
          missingKeys.push(`${listName}[${idx}].${field}`);
        }
      }

      if (player.phase) {
        const p = String(player.phase).toLowerCase();
        if (!VALID_PHASES.includes(p)) {
          missingKeys.push(`${listName}[${idx}].phase (must be powerplay, middle, or death; received "${player.phase}")`);
        }
      }

      if (player.ratingInterval && (!Array.isArray(player.ratingInterval) || player.ratingInterval.length !== 2)) {
        missingKeys.push(`${listName}[${idx}].ratingInterval (must be a 2-element array [lo, hi])`);
      }

      if (player.deltaInterval && (!Array.isArray(player.deltaInterval) || player.deltaInterval.length !== 2)) {
        missingKeys.push(`${listName}[${idx}].deltaInterval (must be a 2-element array [lo, hi])`);
      }
    });
  };

  if (data.batters) validatePlayerList(data.batters, 'batters');
  if (data.bowlers) validatePlayerList(data.bowlers, 'bowlers');

  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
}
