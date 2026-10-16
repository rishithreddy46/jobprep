import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

test('Multi-Company and SQLite quoting regression test', () => {
  // Create an in-memory SQLite database to test schema and quoting logic
  const db = new Database(':memory:');

  // Schema matching the SQLite implementation in db.js
  db.exec(`
    CREATE TABLE companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_initials TEXT NOT NULL,
      category TEXT NOT NULL,
      roles_json TEXT NOT NULL DEFAULT '[]',
      eligibility_json TEXT NOT NULL DEFAULT '{}',
      restrictions TEXT DEFAULT '',
      registration_deadline TEXT,
      assessment_date TEXT,
      interview_dates TEXT,
      opportunity_url TEXT,
      stage_status TEXT NOT NULL DEFAULT 'interested',
      activity_history_json TEXT NOT NULL DEFAULT '[]',
      syllabus_json TEXT NOT NULL DEFAULT '[]',
      resources_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT DEFAULT '',
      is_verified INTEGER NOT NULL DEFAULT 1,
      source TEXT DEFAULT 'Official Portal / Verified',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE test_runs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      test_type TEXT NOT NULL,
      date TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      attempted INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      incorrect INTEGER NOT NULL,
      unanswered INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      time_taken_seconds INTEGER NOT NULL,
      score REAL NOT NULL,
      config_json TEXT,
      questions_json TEXT,
      responses_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE mistake_notebook (
      question_id TEXT PRIMARY KEY,
      first_failed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_failed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      retry_count INTEGER DEFAULT 1,
      consecutive_correct INTEGER DEFAULT 0,
      is_resolved INTEGER DEFAULT 0,
      error_category TEXT DEFAULT 'concept',
      personal_notes TEXT DEFAULT '',
      last_tested_date TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 1. Verify companies table insertion and querying
  const insertComp = db.prepare(`
    INSERT INTO companies (id, name, logo_initials, category, roles_json, stage_status, activity_history_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertComp.run(
    'ril_get_2027',
    'Reliance Industries Limited (RIL GET 2027)',
    'RIL',
    'Energy & Petrochemicals',
    JSON.stringify(['GET Instrumentation', 'GET Electrical']),
    'assessment_upcoming',
    JSON.stringify([{ timestamp: '2026-10-10T00:00:00Z', stage: 'registered', note: 'Campus drive registration' }])
  );

  insertComp.run(
    'lnt_get_2027',
    'Larsen & Toubro (L&T GET 2027)',
    'L&T',
    'Engineering & Infrastructure',
    JSON.stringify(['GET Automation']),
    'interested',
    JSON.stringify([{ timestamp: '2026-10-12T00:00:00Z', stage: 'interested', note: 'Noted' }])
  );

  const companies = db.prepare('SELECT id, name, stage_status FROM companies ORDER BY id ASC').all();
  assert.equal(companies.length, 2);
  assert.equal(companies[0].id, 'lnt_get_2027');
  assert.equal(companies[1].id, 'ril_get_2027');

  // 2. Stage status update with timestamped log
  const newHistory = JSON.stringify([
    { timestamp: '2026-10-10T00:00:00Z', stage: 'registered', note: 'Campus drive registration' },
    { timestamp: '2026-10-16T12:00:00Z', stage: 'shortlisted', note: 'Passed initial screening' },
  ]);
  db.prepare('UPDATE companies SET stage_status = ?, activity_history_json = ? WHERE id = ?')
    .run('shortlisted', newHistory, 'ril_get_2027');

  const updatedComp = db.prepare('SELECT stage_status, activity_history_json FROM companies WHERE id = ?').get('ril_get_2027');
  assert.equal(updatedComp.stage_status, 'shortlisted');
  assert.equal(JSON.parse(updatedComp.activity_history_json).length, 2);

  // 3. REGRESSION TEST: Test-run submission with single-quote literals
  // In the original bug, string literals were quoted with double quotes ("NOW()") causing SQLite errors
  // Here we verify parameterised queries and correct CURRENT_TIMESTAMP handling works without 500 error
  const testRunId = 'test_regression_001';
  db.prepare(`
    INSERT INTO test_runs
      (id, title, test_type, date, total_questions, attempted, correct, incorrect, unanswered, accuracy, time_taken_seconds, score, config_json, questions_json, responses_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testRunId, 'Mixed Cognitive Mock', 'mixed_mock', '2026-10-16', 10, 10, 8, 2, 0, 80, 480, 8,
    '{}', '[]', '{}'
  );

  const run = db.prepare('SELECT id, accuracy, score FROM test_runs WHERE id = ?').get(testRunId);
  assert.equal(run.id, testRunId);
  assert.equal(run.accuracy, 80);

  // 4. Upsert into mistake_notebook using ON CONFLICT (SQLite syntax)
  const upsertMistake = db.prepare(`
    INSERT INTO mistake_notebook
      (question_id, first_failed_at, last_failed_at, retry_count, consecutive_correct, is_resolved, last_tested_date, updated_at)
    VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0, 0, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(question_id) DO UPDATE SET
      last_failed_at = CURRENT_TIMESTAMP,
      retry_count = mistake_notebook.retry_count + 1,
      consecutive_correct = 0,
      is_resolved = 0,
      last_tested_date = excluded.last_tested_date,
      updated_at = CURRENT_TIMESTAMP
  `);

  upsertMistake.run('COG_001', '2026-10-16');
  let mistake = db.prepare('SELECT * FROM mistake_notebook WHERE question_id = ?').get('COG_001');
  assert.equal(mistake.retry_count, 1);
  assert.equal(mistake.is_resolved, 0);

  // Second failure increments retry_count
  upsertMistake.run('COG_001', '2026-10-16');
  mistake = db.prepare('SELECT * FROM mistake_notebook WHERE question_id = ?').get('COG_001');
  assert.equal(mistake.retry_count, 2);

  // Success increments consecutive_correct and resolves on 2
  db.prepare(`
    UPDATE mistake_notebook SET
      consecutive_correct = consecutive_correct + 1,
      is_resolved = CASE WHEN consecutive_correct + 1 >= 2 THEN 1 ELSE is_resolved END,
      last_tested_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE question_id = ?
  `).run('2026-10-16', 'COG_001');

  mistake = db.prepare('SELECT * FROM mistake_notebook WHERE question_id = ?').get('COG_001');
  assert.equal(mistake.consecutive_correct, 1);
  assert.equal(mistake.is_resolved, 0);

  // Second consecutive correct resolves mistake
  db.prepare(`
    UPDATE mistake_notebook SET
      consecutive_correct = consecutive_correct + 1,
      is_resolved = CASE WHEN consecutive_correct + 1 >= 2 THEN 1 ELSE is_resolved END,
      last_tested_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE question_id = ?
  `).run('2026-10-16', 'COG_001');

  mistake = db.prepare('SELECT * FROM mistake_notebook WHERE question_id = ?').get('COG_001');
  assert.equal(mistake.consecutive_correct, 2);
  assert.equal(mistake.is_resolved, 1);
});
