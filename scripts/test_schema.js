import fs from 'fs';
import { validateConsensusData } from '../src/types/schema.js';

console.log('=== RUNNING SCHEMA UNIT TESTS ===\n');

const validData = JSON.parse(fs.readFileSync('src/data/consensus_frontend.json', 'utf-8'));

// Test 1: Valid payload must pass
const resValid = validateConsensusData(validData);
if (!resValid.isValid) {
  console.error('❌ FAIL: Expected validData to pass validation, but got errors:', resValid.missingKeys);
  process.exit(1);
} else {
  console.log('✅ PASS: Real dataset passes schema validation with 0 missing keys.');
}

// Test 2: Unit test that FAILS when a REQUIRED meta key is missing
const missingMetaKeyData = JSON.parse(JSON.stringify(validData));
delete missingMetaKeyData.meta.deliveries_used;
const resMissingMeta = validateConsensusData(missingMetaKeyData);
if (resMissingMeta.isValid || !resMissingMeta.missingKeys.includes('meta.deliveries_used')) {
  console.error('❌ FAIL: Expected missing meta.deliveries_used to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught missing REQUIRED key: "meta.deliveries_used"');
}

// Test 3: Unit test that FAILS when a REQUIRED player field is missing
const missingPlayerFieldData = JSON.parse(JSON.stringify(validData));
delete missingPlayerFieldData.batters[0].phase;
const resMissingPlayer = validateConsensusData(missingPlayerFieldData);
if (resMissingPlayer.isValid || !resMissingPlayer.missingKeys.includes('batters[0].phase')) {
  console.error('❌ FAIL: Expected missing batters[0].phase to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught missing REQUIRED player field: "batters[0].phase"');
}

// Test 4: Unit test that FAILS when phase is invalid
const invalidPhaseData = JSON.parse(JSON.stringify(validData));
invalidPhaseData.bowlers[0].phase = 'invalid_phase';
const resInvalidPhase = validateConsensusData(invalidPhaseData);
if (resInvalidPhase.isValid || !resInvalidPhase.missingKeys.some(k => k.includes('bowlers[0].phase'))) {
  console.error('❌ FAIL: Expected invalid bowlers[0].phase to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught invalid phase value: "invalid_phase"');
}

// Test 5: Unit test that FAILS when deltaIdentified is missing
const missingDeltaIdentifiedData = JSON.parse(JSON.stringify(validData));
delete missingDeltaIdentifiedData.batters[0].deltaIdentified;
const resMissingDeltaId = validateConsensusData(missingDeltaIdentifiedData);
if (resMissingDeltaId.isValid || !resMissingDeltaId.missingKeys.includes('batters[0].deltaIdentified')) {
  console.error('❌ FAIL: Expected missing batters[0].deltaIdentified to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught missing REQUIRED key: "batters[0].deltaIdentified"');
}

// Test 6: Unit test that FAILS when squad_fit recommended length exceeds retention.slots
const exceededSlotsData = JSON.parse(JSON.stringify(validData));
exceededSlotsData.meta.squad_fit.retention.slots = 2; // only 2 slots, but 6 recommended
const resExceededSlots = validateConsensusData(exceededSlotsData);
if (resExceededSlots.isValid || !resExceededSlots.missingKeys.some(k => k.includes('exceeds retention.slots'))) {
  console.error('❌ FAIL: Expected exceeded retention.slots to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught recommended buys exceeding retention.slots');
}

// Test 7: Unit test that FAILS when candidate appears in incumbents for same role+phase
const overlapData = JSON.parse(JSON.stringify(validData));
const candidateName = overlapData.meta.squad_fit.candidates.bow.middle[0].name;
overlapData.meta.squad_fit.incumbents.bow.middle.push({
  name: candidateName,
  rating: 40.0,
  lo: 20.0,
  hi: 60.0,
  pressureBalls: 50,
  pressureInnings: 5,
  lastIplTeam: 'Test Team'
});
const resOverlap = validateConsensusData(overlapData);
if (resOverlap.isValid || !resOverlap.missingKeys.some(k => k.includes('mutual exclusivity violated'))) {
  console.error('❌ FAIL: Expected candidate/incumbent overlap to fail validation, but it passed!');
  process.exit(1);
} else {
  console.log('✅ PASS: Correctly caught incumbent and candidate mutual exclusivity violation');
}

console.log('\n=== ALL SCHEMA UNIT TESTS PASSED ✅ ===');
