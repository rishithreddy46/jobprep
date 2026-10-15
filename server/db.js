/**
 * db.js — Dual-mode database adapter
 *
 * • Production (DATABASE_URL set):  PostgreSQL via `pg` Pool (Neon / any PG)
 * • Local dev  (no DATABASE_URL):   better-sqlite3 (existing behaviour)
 *
 * Exports a `query(sql, params)` async function and a `db` shim so that
 * server/index.js can call await query(...) everywhere.
 *
 * PostgreSQL differences handled here:
 *   - $1,$2,… placeholders instead of ?
 *   - SERIAL / BIGSERIAL instead of AUTOINCREMENT
 *   - BOOLEAN instead of INTEGER for flags
 *   - TIMESTAMP WITH TIME ZONE / TEXT for dates
 *   - ON CONFLICT … DO UPDATE (same syntax, but adapted)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Decide which backend to use
// ─────────────────────────────────────────────────────────────────────────────
const USE_PG = Boolean(process.env.DATABASE_URL);

let pool = null;
let sqliteDb = null;

if (USE_PG) {
  // ─── PostgreSQL ────────────────────────────────────────────────────────────
  const { default: pkg } = await import('pg');
  const { Pool } = pkg;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },    // Neon requires SSL
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('[db] Using PostgreSQL (DATABASE_URL found)');
} else {
  // ─── SQLite (local dev) ────────────────────────────────────────────────────
  const { default: Database } = await import('better-sqlite3');
  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'get_quest.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  console.log('[db] Using SQLite (local dev)');
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified async query API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * query(sql, params)
 *   - For PostgreSQL: uses $1,$2,… placeholders; returns { rows, rowCount }
 *   - For SQLite:     translates ? placeholders; wraps sync result in same shape
 *
 * All callers in index.js use this unified API.
 */
export async function query(sql, params = []) {
  if (USE_PG) {
    const result = await pool.query(sql, params);
    return result;          // { rows: [...], rowCount: N }
  } else {
    // SQLite: translate PG-specific syntax to SQLite equivalents
    let sqliteSql = sql
      .replace(/\$\d+/g, '?')                      // $1,$2,… → ?
      .replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP')  // NOW() → CURRENT_TIMESTAMP
      .replace(/::int\b/gi, '')                     // ::int cast → remove
      .replace(/::bigint\b/gi, '')                  // ::bigint cast → remove
      .replace(/::text\b/gi, '');                   // ::text cast → remove

    const stmt = sqliteDb.prepare(sqliteSql);
    // Detect statement type
    const verb = sqliteSql.trimStart().toUpperCase().slice(0, 6);
    if (verb === 'SELECT') {
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length };
    } else {
      const info = stmt.run(...params);
      return { rows: [], rowCount: info.changes, lastID: info.lastInsertRowid };
    }
  }
}

/**
 * queryOne(sql, params) — convenience: returns first row or null
 */
export async function queryOne(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema initialisation
// ─────────────────────────────────────────────────────────────────────────────

const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS learner_profile (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  name             TEXT    NOT NULL DEFAULT 'RIL GET Aspirant',
  branch           TEXT    NOT NULL DEFAULT 'Electronics & Instrumentation Engineering',
  target_date      TEXT    NOT NULL DEFAULT '2026-10-26T00:00:00',
  daily_goal_mins  INTEGER NOT NULL DEFAULT 60,
  daily_goal_questions INTEGER NOT NULL DEFAULT 20,
  passcode_hash    TEXT    DEFAULT NULL,
  sound_effects    INTEGER NOT NULL DEFAULT 1,
  reduced_motion   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id                       TEXT PRIMARY KEY,
  track                    TEXT NOT NULL,
  topic                    TEXT NOT NULL,
  difficulty               TEXT NOT NULL,
  question                 TEXT NOT NULL,
  options_json             TEXT NOT NULL,
  correct_option_id        TEXT NOT NULL,
  correct_answer           TEXT NOT NULL,
  explanation              TEXT NOT NULL,
  recommended_time_seconds INTEGER NOT NULL DEFAULT 60,
  provenance_json          TEXT,
  is_active                INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_tasks (
  id             TEXT PRIMARY KEY,
  date           TEXT NOT NULL,
  task_index     INTEGER NOT NULL,
  block_time     TEXT,
  task_text      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'not_started',
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  notes          TEXT NOT NULL DEFAULT '',
  score_verified INTEGER NOT NULL DEFAULT 0,
  completed_at   TIMESTAMPTZ DEFAULT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id               TEXT PRIMARY KEY,
  date             TEXT NOT NULL,
  topic            TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  session_type     TEXT NOT NULL DEFAULT 'focus_timer',
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_runs (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  test_type           TEXT NOT NULL,
  date                TEXT NOT NULL,
  total_questions     INTEGER NOT NULL,
  attempted           INTEGER NOT NULL,
  correct             INTEGER NOT NULL,
  incorrect           INTEGER NOT NULL,
  unanswered          INTEGER NOT NULL,
  accuracy            REAL NOT NULL,
  time_taken_seconds  INTEGER NOT NULL,
  score               REAL NOT NULL,
  config_json         TEXT,
  questions_json      TEXT,
  responses_json      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_attempts (
  id               BIGSERIAL PRIMARY KEY,
  test_run_id      TEXT,
  question_id      TEXT NOT NULL,
  track            TEXT NOT NULL,
  topic            TEXT NOT NULL,
  difficulty       TEXT NOT NULL,
  chosen_option_id TEXT,
  is_correct       INTEGER NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  test_mode        TEXT NOT NULL DEFAULT 'mock',
  date             TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mistake_notebook (
  question_id          TEXT PRIMARY KEY,
  first_failed_at      TIMESTAMPTZ DEFAULT NOW(),
  last_failed_at       TIMESTAMPTZ DEFAULT NOW(),
  retry_count          INTEGER NOT NULL DEFAULT 1,
  consecutive_correct  INTEGER NOT NULL DEFAULT 0,
  is_resolved          INTEGER NOT NULL DEFAULT 0,
  error_category       TEXT NOT NULL DEFAULT 'concept',
  personal_notes       TEXT NOT NULL DEFAULT '',
  last_tested_date     TEXT,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xp_events (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  action_type   TEXT NOT NULL,
  xp_awarded    INTEGER NOT NULL,
  metadata_json TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_activity (
  date                  TEXT PRIMARY KEY,
  total_active_seconds  INTEGER NOT NULL DEFAULT 0,
  questions_attempted   INTEGER NOT NULL DEFAULT 0,
  questions_correct     INTEGER NOT NULL DEFAULT 0,
  tasks_completed       INTEGER NOT NULL DEFAULT 0,
  qualified_streak      INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  badge_id    TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_generated_questions (
  id                       TEXT PRIMARY KEY,
  track                    TEXT NOT NULL,
  topic                    TEXT NOT NULL,
  difficulty               TEXT NOT NULL,
  question                 TEXT NOT NULL,
  options_json             TEXT NOT NULL,
  correct_option_id        TEXT NOT NULL,
  correct_answer           TEXT NOT NULL,
  explanation              TEXT NOT NULL,
  recommended_time_seconds INTEGER NOT NULL DEFAULT 60,
  status                   TEXT NOT NULL DEFAULT 'pending_review',
  provider_model           TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);
`;

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS learner_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT DEFAULT 'Candidate',
    branch TEXT DEFAULT 'Electronics & Instrumentation Engineering',
    target_date TEXT DEFAULT '2026-10-26T00:00:00',
    daily_goal_mins INTEGER DEFAULT 60,
    daily_goal_questions INTEGER DEFAULT 20,
    passcode_hash TEXT DEFAULT NULL,
    sound_effects INTEGER DEFAULT 1,
    reduced_motion INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY, track TEXT NOT NULL, topic TEXT NOT NULL,
    difficulty TEXT NOT NULL, question TEXT NOT NULL, options_json TEXT NOT NULL,
    correct_option_id TEXT NOT NULL, correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL, recommended_time_seconds INTEGER DEFAULT 60,
    provenance_json TEXT, is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS study_tasks (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, task_index INTEGER NOT NULL,
    block_time TEXT, task_text TEXT NOT NULL, status TEXT DEFAULT 'not_started',
    actual_minutes INTEGER DEFAULT 0, notes TEXT DEFAULT '',
    score_verified INTEGER DEFAULT 0, completed_at DATETIME DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL, session_type TEXT DEFAULT 'focus_timer',
    notes TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS test_runs (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, test_type TEXT NOT NULL,
    date TEXT NOT NULL, total_questions INTEGER NOT NULL, attempted INTEGER NOT NULL,
    correct INTEGER NOT NULL, incorrect INTEGER NOT NULL, unanswered INTEGER NOT NULL,
    accuracy REAL NOT NULL, time_taken_seconds INTEGER NOT NULL, score REAL NOT NULL,
    config_json TEXT, questions_json TEXT, responses_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, test_run_id TEXT,
    question_id TEXT NOT NULL, track TEXT NOT NULL, topic TEXT NOT NULL,
    difficulty TEXT NOT NULL, chosen_option_id TEXT, is_correct INTEGER NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0, test_mode TEXT DEFAULT 'mock',
    date TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mistake_notebook (
    question_id TEXT PRIMARY KEY,
    first_failed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_failed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 1, consecutive_correct INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0, error_category TEXT DEFAULT 'concept',
    personal_notes TEXT DEFAULT '', last_tested_date TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS xp_events (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, action_type TEXT NOT NULL,
    xp_awarded INTEGER NOT NULL, metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS daily_activity (
    date TEXT PRIMARY KEY, total_active_seconds INTEGER DEFAULT 0,
    questions_attempted INTEGER DEFAULT 0, questions_correct INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0, qualified_streak INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_achievements (
    badge_id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    icon TEXT NOT NULL, unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS ai_generated_questions (
    id TEXT PRIMARY KEY, track TEXT NOT NULL, topic TEXT NOT NULL,
    difficulty TEXT NOT NULL, question TEXT NOT NULL, options_json TEXT NOT NULL,
    correct_option_id TEXT NOT NULL, correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL, recommended_time_seconds INTEGER DEFAULT 60,
    status TEXT DEFAULT 'pending_review', provider_model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

async function initSchema() {
  if (USE_PG) {
    // Run each CREATE TABLE IF NOT EXISTS separately
    const statements = PG_SCHEMA
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10);
    for (const stmt of statements) {
      await pool.query(stmt + ';');
    }
  } else {
    sqliteDb.exec(SQLITE_SCHEMA);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed questions from question_bank.json
// ─────────────────────────────────────────────────────────────────────────────
export async function seedQuestions(force = false) {
  const { rows } = await query('SELECT COUNT(*) AS count FROM questions');
  const count = parseInt(rows[0].count, 10);
  if (count > 0 && !force) return count;

  const raw = fs.readFileSync(path.join(rootDir, 'question_bank.json'), 'utf8');
  const data = JSON.parse(raw);

  for (const q of data.questions) {
    if (USE_PG) {
      await pool.query(`
        INSERT INTO questions
          (id, track, topic, difficulty, question, options_json,
           correct_option_id, correct_answer, explanation,
           recommended_time_seconds, provenance_json)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT(id) DO UPDATE SET
          track = EXCLUDED.track, topic = EXCLUDED.topic,
          difficulty = EXCLUDED.difficulty, question = EXCLUDED.question,
          options_json = EXCLUDED.options_json,
          correct_option_id = EXCLUDED.correct_option_id,
          correct_answer = EXCLUDED.correct_answer,
          explanation = EXCLUDED.explanation,
          recommended_time_seconds = EXCLUDED.recommended_time_seconds,
          provenance_json = EXCLUDED.provenance_json
      `, [
        q.id, q.track, q.topic, q.difficulty, q.question,
        JSON.stringify(q.options), q.correct_option_id, q.correct_answer,
        q.explanation, q.recommended_time_seconds || 60,
        JSON.stringify(q.provenance || {}),
      ]);
    } else {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO questions
          (id, track, topic, difficulty, question, options_json,
           correct_option_id, correct_answer, explanation,
           recommended_time_seconds, provenance_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        q.id, q.track, q.topic, q.difficulty, q.question,
        JSON.stringify(q.options), q.correct_option_id, q.correct_answer,
        q.explanation, q.recommended_time_seconds || 60,
        JSON.stringify(q.provenance || {}),
      );
    }
  }
  return data.questions.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed study plan from study_plan.json
// ─────────────────────────────────────────────────────────────────────────────
export async function seedStudyPlan(force = false) {
  const { rows } = await query('SELECT COUNT(*) AS count FROM study_tasks');
  const count = parseInt(rows[0].count, 10);
  if (count > 0 && !force) return count;

  const raw = fs.readFileSync(path.join(rootDir, 'study_plan.json'), 'utf8');
  const plan = JSON.parse(raw);

  for (const day of plan.days) {
    for (let idx = 0; idx < day.blocks.length; idx++) {
      const b = day.blocks[idx];
      const taskId = `${day.date}_task_${idx}`;
      if (USE_PG) {
        await pool.query(`
          INSERT INTO study_tasks (id, date, task_index, block_time, task_text, status)
          VALUES ($1,$2,$3,$4,$5,'not_started')
          ON CONFLICT(id) DO NOTHING
        `, [taskId, day.date, idx, b.time, b.task]);
      } else {
        sqliteDb.prepare(`
          INSERT OR IGNORE INTO study_tasks (id, date, task_index, block_time, task_text, status)
          VALUES (?, ?, ?, ?, ?, 'not_started')
        `).run(taskId, day.date, idx, b.time, b.task);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default learner profile
// ─────────────────────────────────────────────────────────────────────────────
async function ensureProfile() {
  if (USE_PG) {
    await pool.query(`
      INSERT INTO learner_profile
        (id, name, branch, target_date, daily_goal_mins, daily_goal_questions)
      VALUES (1, 'RIL GET Aspirant', 'Electronics & Instrumentation Engineering',
              '2026-10-26T00:00:00', 60, 20)
      ON CONFLICT(id) DO NOTHING
    `);
  } else {
    const existing = sqliteDb.prepare('SELECT id FROM learner_profile WHERE id = 1').get();
    if (!existing) {
      sqliteDb.prepare(`
        INSERT INTO learner_profile (id, name, branch, target_date, daily_goal_mins, daily_goal_questions)
        VALUES (1, 'RIL GET Aspirant', 'Electronics & Instrumentation Engineering',
                '2026-10-26T00:00:00', 60, 20)
      `).run();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot sequence — called once at server startup
// ─────────────────────────────────────────────────────────────────────────────
export async function initDB() {
  await initSchema();
  await ensureProfile();
  await seedQuestions();
  await seedStudyPlan();
  console.log('[db] Initialisation complete');
}

// Export pool/sqliteDb for any edge case direct usage
export { pool, sqliteDb };
export default { query, queryOne };
