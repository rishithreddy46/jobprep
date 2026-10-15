import test from 'node:test';
import assert from 'node:assert/strict';

function calculateDailyReport(date, attempts, sessions, tasks) {
  const dayAttempts = attempts.filter((a) => a.date === date);
  const daySessions = sessions.filter((s) => s.date === date);
  const dayTasks = tasks.filter((t) => t.date === date);

  const attempted = dayAttempts.length;
  const correct = dayAttempts.filter((a) => a.is_correct === 1).length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const measuredMins = Math.round(daySessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);

  return {
    date,
    attempted,
    correct,
    accuracy,
    measuredMins,
    tasksCount: dayTasks.length,
    completedTasks: dayTasks.filter((t) => t.status === 'completed').length,
  };
}

function calculateCumulativeReport(upToDate, attempts, sessions, tasks) {
  const cumAttempts = attempts.filter((a) => a.date <= upToDate);
  const cumSessions = sessions.filter((s) => s.date <= upToDate);
  const cumTasks = tasks.filter((t) => t.date <= upToDate);

  const attempted = cumAttempts.length;
  const correct = cumAttempts.filter((a) => a.is_correct === 1).length;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const measuredMins = Math.round(cumSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 60);

  return {
    upToDate,
    attempted,
    correct,
    accuracy,
    measuredMins,
    tasksCount: cumTasks.length,
    completedTasks: cumTasks.filter((t) => t.status === 'completed').length,
  };
}

test('Daily vs Cumulative Reports segregation logic', () => {
  // Day 1 events
  const attempts = [
    { date: '2026-10-16', is_correct: 1 },
    { date: '2026-10-16', is_correct: 1 },
    { date: '2026-10-16', is_correct: 0 },
    // Day 2 events
    { date: '2026-10-17', is_correct: 1 },
    { date: '2026-10-17', is_correct: 0 },
  ];

  const sessions = [
    { date: '2026-10-16', duration_seconds: 1800 }, // 30 mins
    { date: '2026-10-17', duration_seconds: 3600 }, // 60 mins
  ];

  const tasks = [
    { date: '2026-10-16', status: 'completed' },
    { date: '2026-10-16', status: 'completed' },
    { date: '2026-10-17', status: 'completed' },
    { date: '2026-10-17', status: 'in_progress' },
  ];

  // Test Day 1 Daily
  const day1Daily = calculateDailyReport('2026-10-16', attempts, sessions, tasks);
  assert.equal(day1Daily.attempted, 3);
  assert.equal(day1Daily.correct, 2);
  assert.equal(day1Daily.accuracy, 67);
  assert.equal(day1Daily.measuredMins, 30);
  assert.equal(day1Daily.completedTasks, 2);

  // Test Day 2 Daily (MUST NOT contain Day 1 data!)
  const day2Daily = calculateDailyReport('2026-10-17', attempts, sessions, tasks);
  assert.equal(day2Daily.attempted, 2);
  assert.equal(day2Daily.correct, 1);
  assert.equal(day2Daily.accuracy, 50);
  assert.equal(day2Daily.measuredMins, 60);
  assert.equal(day2Daily.completedTasks, 1);

  // Test Day 2 Cumulative (MUST include Day 1 + Day 2 data!)
  const day2Cum = calculateCumulativeReport('2026-10-17', attempts, sessions, tasks);
  assert.equal(day2Cum.attempted, 5); // 3 + 2
  assert.equal(day2Cum.correct, 3);   // 2 + 1
  assert.equal(day2Cum.accuracy, 60); // 3 / 5 = 60%
  assert.equal(day2Cum.measuredMins, 90); // 30 + 60
  assert.equal(day2Cum.completedTasks, 3); // 2 + 1
});
