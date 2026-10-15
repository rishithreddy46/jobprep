import test from 'node:test';
import assert from 'node:assert/strict';

function calculateLevel(totalXP) {
  const levels = [
    { level: 1, title: 'Novice Cadet', threshold: 0, next: 100 },
    { level: 2, title: 'Apprentice Engineer', threshold: 100, next: 250 },
    { level: 3, title: 'Calibration Specialist', threshold: 250, next: 500 },
    { level: 4, title: 'Control Room Operator', threshold: 500, next: 850 },
    { level: 5, title: 'Automation Lead', threshold: 850, next: 1300 },
    { level: 6, title: 'Process Architect', threshold: 1300, next: 1900 },
    { level: 7, title: 'Chief Systems Engineer', threshold: 1900, next: 2700 },
    { level: 8, title: 'RIL GET Grandmaster', threshold: 2700, next: 4000 },
  ];

  let current = levels[0];
  for (const l of levels) {
    if (totalXP >= l.threshold) current = l;
  }
  return current;
}

test('Level threshold progression calculates correctly across XP values', () => {
  assert.equal(calculateLevel(0).level, 1);
  assert.equal(calculateLevel(99).level, 1);
  assert.equal(calculateLevel(100).level, 2);
  assert.equal(calculateLevel(249).level, 2);
  assert.equal(calculateLevel(250).level, 3);
  assert.equal(calculateLevel(850).level, 5);
  assert.equal(calculateLevel(3000).level, 8);
});

test('XP events table ensures idempotency and deduplication', () => {
  const eventLedger = new Map();

  function awardIdempotentXP(key, amount) {
    if (eventLedger.has(key)) {
      return { awarded: 0, reason: 'duplicate' };
    }
    eventLedger.set(key, amount);
    return { awarded: amount, reason: 'success' };
  }

  // First call succeeds
  const call1 = awardIdempotentXP('task_2026-10-16_0_complete', 10);
  assert.equal(call1.awarded, 10);
  assert.equal(call1.reason, 'success');

  // Second call with same event key fails gracefully with 0 XP
  const call2 = awardIdempotentXP('task_2026-10-16_0_complete', 10);
  assert.equal(call2.awarded, 0);
  assert.equal(call2.reason, 'duplicate');

  // Third call on page refresh also awards 0
  const call3 = awardIdempotentXP('task_2026-10-16_0_complete', 10);
  assert.equal(call3.awarded, 0);
  assert.equal(call3.reason, 'duplicate');
});
