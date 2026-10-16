/**
 * server/index.js — GET Quest Express API
 *
 * Supports both PostgreSQL (production, DATABASE_URL env var) and
 * SQLite (local dev, no DATABASE_URL).
 *
 * In production: also serves the Vite dist/ build as static files.
 * All DB calls are async (await query(...)).
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { initDB, query, queryOne, seedQuestions, seedStudyPlan } from './db.js';
import { getAiStatus, generatePracticeQuestions, approveQuestion, rejectQuestion } from './aiService.js';
import { bootstrapAuth, handleLogin, handleLogout, handleGetMe, handleChangePassword, requireAuth } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// In production: serve Vite build
if (IS_PROD) {
  const distDir = path.join(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    console.log('[server] Serving static dist/ in production');
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Authoritative Indian Standard Time (Asia/Kolkata) date string YYYY-MM-DD
export function getISTDateString(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

// Award XP idempotently (one unique_key = one award, ever)
async function awardXP(date, action_type, xp_amount, unique_key, metadata = {}) {
  try {
    const existing = await queryOne('SELECT id FROM xp_events WHERE id = $1', [unique_key]);
    if (existing) return { awarded: 0, reason: 'already_awarded' };
    await query(
      'INSERT INTO xp_events (id, date, action_type, xp_awarded, metadata_json) VALUES ($1,$2,$3,$4,$5)',
      [unique_key, date, action_type, xp_amount, JSON.stringify(metadata)]
    );
    return { awarded: xp_amount, reason: 'success' };
  } catch (err) {
    console.error('awardXP error:', err.message);
    return { awarded: 0, error: err.message };
  }
}

// Check streak qualification and upsert daily_activity
async function checkAndUpdateStreak(date) {
  const profile = await queryOne('SELECT daily_goal_mins, daily_goal_questions FROM learner_profile WHERE id = 1');
  const goalMins = (profile && profile.daily_goal_mins) || 30;
  const goalQuestions = (profile && profile.daily_goal_questions) || 10;

  const sessRow = await queryOne(
    'SELECT COALESCE(SUM(duration_seconds),0) AS total_secs FROM study_sessions WHERE date = $1',
    [date]
  );
  const sessionSecs = parseInt(sessRow?.total_secs ?? 0, 10);

  const qRow = await queryOne(
    'SELECT COUNT(*) AS count, COALESCE(SUM(is_correct),0) AS correct_count FROM question_attempts WHERE date = $1',
    [date]
  );
  const qCount  = parseInt(qRow?.count ?? 0, 10);
  const qCorrect = parseInt(qRow?.correct_count ?? 0, 10);

  const tRow = await queryOne(
    "SELECT COUNT(*) AS count FROM study_tasks WHERE date = $1 AND status = 'completed'",
    [date]
  );
  const taskCount = parseInt(tRow?.count ?? 0, 10);

  const qualified = (sessionSecs >= 15 * 60) || (qCount >= 5) || (taskCount >= 2) ? 1 : 0;

  await query(`
    INSERT INTO daily_activity
      (date, total_active_seconds, questions_attempted, questions_correct, tasks_completed, qualified_streak, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6, NOW())
    ON CONFLICT(date) DO UPDATE SET
      total_active_seconds = EXCLUDED.total_active_seconds,
      questions_attempted  = EXCLUDED.questions_attempted,
      questions_correct    = EXCLUDED.questions_correct,
      tasks_completed      = EXCLUDED.tasks_completed,
      qualified_streak     = EXCLUDED.qualified_streak,
      updated_at           = NOW()
  `, [date, sessionSecs, qCount, qCorrect, taskCount, qualified]);

  return { qualified, sessionSecs, questionCount: qCount, taskCount };
}

// Evaluate and persist achievement badges
async function evaluateAchievements() {
  const totalRow    = await queryOne('SELECT COUNT(*) AS count FROM question_attempts');
  const totalAttempts = parseInt(totalRow?.count ?? 0, 10);

  const mocksRow    = await queryOne('SELECT COUNT(*) AS count FROM test_runs');
  const totalMocks  = parseInt(mocksRow?.count ?? 0, 10);

  const streakRow   = await queryOne('SELECT COUNT(*) AS count FROM daily_activity WHERE qualified_streak = 1');
  const streakDays  = parseInt(streakRow?.count ?? 0, 10);

  const secsRow     = await queryOne('SELECT COALESCE(SUM(duration_seconds),0) AS total FROM study_sessions');
  const totalSecs   = parseInt(secsRow?.total ?? 0, 10);

  const resolvedRow = await queryOne('SELECT COUNT(*) AS count FROM mistake_notebook WHERE is_resolved = 1');
  const resolvedMistakes = parseInt(resolvedRow?.count ?? 0, 10);

  const cogRow  = await queryOne(
    "SELECT COUNT(*) AS count, COALESCE(SUM(is_correct),0) AS correct FROM question_attempts WHERE track = 'cognitive'"
  );
  const instRow = await queryOne(
    "SELECT COUNT(*) AS count, COALESCE(SUM(is_correct),0) AS correct FROM question_attempts WHERE track = 'instrumentation'"
  );
  const cogCount   = parseInt(cogRow?.count ?? 0, 10);
  const cogCorrect = parseInt(cogRow?.correct ?? 0, 10);
  const instCount  = parseInt(instRow?.count ?? 0, 10);
  const instCorrect= parseInt(instRow?.correct ?? 0, 10);

  const rules = [
    {
      id: 'first_step', title: 'First Step',
      description: 'Attempt your first practice question in the Arena.', icon: 'Target',
      unlocked: totalAttempts >= 1,
    },
    {
      id: 'mock_pioneer', title: 'Mock Pioneer',
      description: 'Complete your first practice test or simulation.', icon: 'Award',
      unlocked: totalMocks >= 1,
    },
    {
      id: 'centurion', title: 'Centurion',
      description: 'Attempt 100 questions across Cognitive and Instrumentation.', icon: 'Shield',
      unlocked: totalAttempts >= 100,
    },
    {
      id: 'streak_3', title: 'Ignition Streak',
      description: 'Maintain a 3-day active preparation streak.', icon: 'Flame',
      unlocked: streakDays >= 3,
    },
    {
      id: 'streak_7', title: 'Unstoppable Momentum',
      description: 'Maintain a 7-day active preparation streak.', icon: 'Zap',
      unlocked: streakDays >= 7,
    },
    {
      id: 'deep_focus', title: 'Deep Focus',
      description: 'Accumulate over 60 minutes of measured study timer.', icon: 'Clock',
      unlocked: totalSecs >= 3600,
    },
    {
      id: 'mistake_slayer', title: 'Mistake Slayer',
      description: 'Resolve and master 5 questions in your Mistake Notebook.', icon: 'CheckCircle',
      unlocked: resolvedMistakes >= 5,
    },
    {
      id: 'cognitive_sharpness', title: 'Cognitive Sharpness',
      description: 'Achieve >= 80% accuracy across 20+ cognitive questions.', icon: 'Brain',
      unlocked: cogCount >= 20 && cogCount > 0 && (cogCorrect / cogCount) >= 0.8,
    },
    {
      id: 'instrument_virtuoso', title: 'Industrial Virtuoso',
      description: 'Achieve >= 80% accuracy across 30+ instrumentation questions.', icon: 'Sliders',
      unlocked: instCount >= 30 && instCount > 0 && (instCorrect / instCount) >= 0.8,
    },
  ];

  for (const r of rules) {
    if (r.unlocked) {
      await query(
        'INSERT INTO user_achievements (badge_id, title, description, icon) VALUES ($1,$2,$3,$4) ON CONFLICT(badge_id) DO NOTHING',
        [r.id, r.title, r.description, r.icon]
      );
    }
  }

  const { rows } = await query('SELECT * FROM user_achievements ORDER BY unlocked_at DESC');
  return rows;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

// 0. Single-User Authentication (Username: Rishith)
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/logout', handleLogout);
app.get('/api/auth/me', handleGetMe);
app.post('/api/auth/change-password', handleChangePassword);

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timezone: 'Asia/Kolkata', istDate: getISTDateString(), time: new Date().toISOString() });
});

// 2. Profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await queryOne('SELECT * FROM learner_profile WHERE id = 1');
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { name, branch, target_date, daily_goal_mins, daily_goal_questions, passcode_hash, sound_effects, reduced_motion } = req.body;
    await query(`
      UPDATE learner_profile SET
        name = COALESCE($1, name),
        branch = COALESCE($2, branch),
        target_date = COALESCE($3, target_date),
        daily_goal_mins = COALESCE($4, daily_goal_mins),
        daily_goal_questions = COALESCE($5, daily_goal_questions),
        passcode_hash = $6,
        sound_effects = COALESCE($7, sound_effects),
        reduced_motion = COALESCE($8, reduced_motion),
        updated_at = NOW()
      WHERE id = 1
    `, [name, branch, target_date, daily_goal_mins, daily_goal_questions, passcode_hash, sound_effects, reduced_motion]);
    const updated = await queryOne('SELECT * FROM learner_profile WHERE id = 1');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Questions
app.get('/api/questions', async (req, res) => {
  try {
    const { track, topic, difficulty, limit, shuffle, unseen_only } = req.query;
    const params = [];
    let conditions = ['is_active = 1'];

    if (track && track !== 'all') {
      params.push(track);
      conditions.push(`track = $${params.length}`);
    }
    if (topic && topic !== 'all') {
      params.push(topic);
      conditions.push(`topic = $${params.length}`);
    }
    if (difficulty && difficulty !== 'all') {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (unseen_only === 'true') {
      conditions.push('id NOT IN (SELECT DISTINCT question_id FROM question_attempts)');
    }

    let sql = `SELECT * FROM questions WHERE ${conditions.join(' AND ')}`;
    sql += shuffle === 'true' ? ' ORDER BY RANDOM()' : ' ORDER BY id ASC';

    if (limit) {
      params.push(parseInt(limit, 10));
      sql += ` LIMIT $${params.length}`;
    }

    const { rows } = await query(sql, params);
    const formatted = rows.map(r => ({
      ...r,
      options: JSON.parse(r.options_json),
      provenance: r.provenance_json ? JSON.parse(r.provenance_json) : {},
      diagram_spec: r.diagram_spec_json ? JSON.parse(r.diagram_spec_json) : null,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/questions/stats', async (req, res) => {
  try {
    const { rows: [totalRow] } = await query('SELECT COUNT(*) AS count FROM questions WHERE is_active = 1');
    const { rows: tracks }     = await query('SELECT track, COUNT(*) AS count FROM questions WHERE is_active = 1 GROUP BY track');
    const { rows: difficulties }= await query('SELECT difficulty, COUNT(*) AS count FROM questions WHERE is_active = 1 GROUP BY difficulty');
    const { rows: topics }     = await query('SELECT topic, track, COUNT(*) AS count FROM questions WHERE is_active = 1 GROUP BY topic, track ORDER BY count DESC');
    res.json({ total: parseInt(totalRow.count, 10), tracks, difficulties, topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Study Plan
app.get('/api/study-plan', async (req, res) => {
  try {
    const rawPlan = fs.readFileSync(path.join(rootDir, 'study_plan.json'), 'utf8');
    const plan = JSON.parse(rawPlan);

    const { rows: tasks } = await query('SELECT * FROM study_tasks ORDER BY date ASC, task_index ASC');
    const tasksByDate = {};
    for (const t of tasks) {
      if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
      tasksByDate[t.date].push(t);
    }

    const days = plan.days.map(d => ({
      ...d,
      tasks: tasksByDate[d.date] || [],
    }));

    res.json({
      start: plan.start, end: plan.end,
      timezone: plan.timezone, special_note: plan.special_note,
      days,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/study-plan/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_minutes, notes, score_verified } = req.body;

    const current = await queryOne('SELECT * FROM study_tasks WHERE id = $1', [id]);
    if (!current) return res.status(404).json({ error: 'Task not found' });

    const completedAt = status === 'completed' ? new Date().toISOString() : null;

    await query(`
      UPDATE study_tasks SET
        status         = COALESCE($1, status),
        actual_minutes = COALESCE($2, actual_minutes),
        notes          = COALESCE($3, notes),
        score_verified = COALESCE($4, score_verified),
        completed_at   = COALESCE($5, completed_at),
        updated_at     = NOW()
      WHERE id = $6
    `, [status, actual_minutes, notes, score_verified, completedAt, id]);

    let xpResult = { awarded: 0 };
    if (status === 'completed') {
      xpResult = await awardXP(current.date, 'study_task_completed', 10, `task_${id}_completed`, { taskId: id });
    }

    const { rows: dayTasks } = await query('SELECT status FROM study_tasks WHERE date = $1', [current.date]);
    const allDone = dayTasks.length > 0 && dayTasks.every(t => t.status === 'completed');
    let bonusXp = 0;
    if (allDone) {
      const bonus = await awardXP(current.date, 'daily_mission_bonus', 25, `day_${current.date}_all_tasks_bonus`, { date: current.date });
      bonusXp = bonus.awarded;
    }

    await checkAndUpdateStreak(current.date);
    await evaluateAchievements();

    const updated = await queryOne('SELECT * FROM study_tasks WHERE id = $1', [id]);
    res.json({ task: updated, xpAwarded: xpResult.awarded + bonusXp });
  } catch (err) {
    console.error('PUT /api/study-plan/tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Study Sessions (Focus Timer)
app.post('/api/study-sessions', async (req, res) => {
  try {
    const { date, topic, duration_seconds, session_type, notes } = req.body;
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(
      'INSERT INTO study_sessions (id, date, topic, duration_seconds, session_type, notes) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, date, topic || 'General Study', duration_seconds, session_type || 'focus_timer', notes || '']
    );

    let xpAwarded = 0;
    if (duration_seconds >= 900) {
      const xp = await awardXP(date, 'focus_session_completed', 5, `session_${id}_xp`, { duration_seconds, topic });
      xpAwarded = xp.awarded;
    }

    await checkAndUpdateStreak(date);
    await evaluateAchievements();
    res.json({ success: true, id, xpAwarded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Test Runs — core endpoint (previously threw 500 due to SQLite quoting bug)
app.post('/api/test-runs', async (req, res) => {
  try {
    const {
      id: customId, title, test_type, date, total_questions, attempted,
      correct, incorrect, unanswered, accuracy, time_taken_seconds, score,
      config, questions, responses,
    } = req.body;

    const testId = customId || `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(`
      INSERT INTO test_runs
        (id, title, test_type, date, total_questions, attempted, correct,
         incorrect, unanswered, accuracy, time_taken_seconds, score,
         config_json, questions_json, responses_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, [
      testId, title, test_type, date, total_questions, attempted,
      correct, incorrect, unanswered, accuracy, time_taken_seconds, score,
      JSON.stringify(config || {}), JSON.stringify(questions || []), JSON.stringify(responses || {}),
    ]);

    // Individual question attempts + mistake notebook
    for (const q of questions) {
      const resp = responses[q.id];
      const isAttempted = resp && resp.chosen_option_id !== undefined && resp.chosen_option_id !== null;
      const isCorrect = isAttempted && resp.chosen_option_id === q.correct_option_id ? 1 : 0;
      const timeSpent = (resp && resp.time_spent) || 0;

      await query(
        'INSERT INTO question_attempts (test_run_id,question_id,track,topic,difficulty,chosen_option_id,is_correct,time_spent_seconds,test_mode,date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [testId, q.id, q.track, q.topic, q.difficulty, isAttempted ? resp.chosen_option_id : null, isCorrect, timeSpent, test_type, date]
      );

      if (isAttempted && !isCorrect) {
        await query(`
          INSERT INTO mistake_notebook
            (question_id, first_failed_at, last_failed_at, retry_count, consecutive_correct, is_resolved, last_tested_date, updated_at)
          VALUES ($1, NOW(), NOW(), 1, 0, 0, $2, NOW())
          ON CONFLICT(question_id) DO UPDATE SET
            last_failed_at = NOW(), retry_count = mistake_notebook.retry_count + 1,
            consecutive_correct = 0, is_resolved = 0,
            last_tested_date = EXCLUDED.last_tested_date, updated_at = NOW()
        `, [q.id, date]);
      } else if (isAttempted && isCorrect) {
        await query(`
          UPDATE mistake_notebook SET
            consecutive_correct = consecutive_correct + 1,
            is_resolved = CASE WHEN consecutive_correct + 1 >= 2 THEN 1 ELSE is_resolved END,
            last_tested_date = $1, updated_at = NOW()
          WHERE question_id = $2
        `, [date, q.id]);
      }
    }

    const baseXP = test_type === 'mixed_mock' || test_type === 'boss_battle' ? 15 : 10;
    let totalXpAwarded = (await awardXP(date, 'test_completed', baseXP, `test_${testId}_completed`, { testId, accuracy })).awarded;

    if (accuracy >= 80 && attempted >= 5) {
      const bonus = await awardXP(date, 'test_high_accuracy_bonus', 10, `test_${testId}_accuracy_bonus`, { testId, accuracy });
      totalXpAwarded += bonus.awarded;
    }

    await checkAndUpdateStreak(date);
    await evaluateAchievements();

    res.json({ success: true, testId, xpAwarded: totalXpAwarded });
  } catch (err) {
    console.error('POST /api/test-runs error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-runs', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id,title,test_type,date,total_questions,attempted,correct,incorrect,unanswered,accuracy,time_taken_seconds,score,created_at FROM test_runs ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test-runs/:id', async (req, res) => {
  try {
    const run = await queryOne('SELECT * FROM test_runs WHERE id = $1', [req.params.id]);
    if (!run) return res.status(404).json({ error: 'Test run not found' });
    res.json({
      ...run,
      config: JSON.parse(run.config_json || '{}'),
      questions: JSON.parse(run.questions_json || '[]'),
      responses: JSON.parse(run.responses_json || '{}'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Assessment Generator: Checkpoint & Daily Cumulative
app.post('/api/assessments/generate', async (req, res) => {
  try {
    const { type = 'daily_cumulative', date = getISTDateString(), topics = [] } = req.body;
    const { rows: allQuestions } = await query('SELECT * FROM questions WHERE is_active = 1');
    const parsedAll = allQuestions.map(q => ({
      ...q,
      options: JSON.parse(q.options_json),
      provenance: q.provenance_json ? JSON.parse(q.provenance_json) : {},
      diagram_spec: q.diagram_spec_json ? JSON.parse(q.diagram_spec_json) : null,
    }));

    let selectedQuestions = [];
    let title = '';
    let durationSeconds = 900;

    if (type === 'checkpoint') {
      title = `Checkpoint Assessment — Micro-Level Milestone (${date})`;
      durationSeconds = 1200;
      const quant = parsedAll.filter(q => q.track === 'cognitive' && !q.id.startsWith('vis_')).sort(() => Math.random() - 0.5).slice(0, 3);
      const visual = parsedAll.filter(q => q.id.startsWith('vis_')).sort(() => Math.random() - 0.5).slice(0, 3);
      const tech = parsedAll.filter(q => q.track === 'instrumentation').sort(() => Math.random() - 0.5).slice(0, 4);
      selectedQuestions = [...quant, ...visual, ...tech];
    } else {
      title = `Daily Cumulative Assessment — Mission Recap (${date})`;
      durationSeconds = 900;
      const { rows: mistakeRows } = await query('SELECT question_id FROM mistake_notebook WHERE is_resolved = 0 LIMIT 3');
      const mistakeIds = new Set(mistakeRows.map(m => m.question_id));
      const mistakeQuestions = parsedAll.filter(q => mistakeIds.has(q.id));
      const visual = parsedAll.filter(q => q.id.startsWith('vis_') && !mistakeIds.has(q.id)).sort(() => Math.random() - 0.5).slice(0, 3);
      const cog = parsedAll.filter(q => q.track === 'cognitive' && !q.id.startsWith('vis_') && !mistakeIds.has(q.id)).sort(() => Math.random() - 0.5).slice(0, 3);
      const tech = parsedAll.filter(q => q.track === 'instrumentation' && !mistakeIds.has(q.id)).sort(() => Math.random() - 0.5).slice(0, 4);
      selectedQuestions = [...mistakeQuestions, ...visual, ...cog, ...tech].slice(0, 10);
    }

    const testId = `assess_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    res.json({
      testId,
      title,
      test_type: type,
      date,
      durationSeconds,
      totalQuestions: selectedQuestions.length,
      questions: selectedQuestions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Multi-Company Directory API (JobPrep Platform) ─────────────────────────

app.get('/api/companies', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM companies ORDER BY created_at ASC');
    const formatted = rows.map(r => ({
      ...r,
      roles: JSON.parse(r.roles_json || '[]'),
      eligibility: JSON.parse(r.eligibility_json || '{}'),
      activity_history: JSON.parse(r.activity_history_json || '[]'),
      syllabus: JSON.parse(r.syllabus_json || '[]'),
      resources: JSON.parse(r.resources_json || '[]'),
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const r = await queryOne('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!r) return res.status(404).json({ error: 'Company not found' });
    res.json({
      ...r,
      roles: JSON.parse(r.roles_json || '[]'),
      eligibility: JSON.parse(r.eligibility_json || '{}'),
      activity_history: JSON.parse(r.activity_history_json || '[]'),
      syllabus: JSON.parse(r.syllabus_json || '[]'),
      resources: JSON.parse(r.resources_json || '[]'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const {
      id: customId,
      name,
      logo_initials,
      category,
      roles = [],
      eligibility = {},
      restrictions = '',
      registration_deadline,
      assessment_date,
      interview_dates,
      opportunity_url = '',
      stage_status = 'interested',
      activity_note = 'Company added to tracking list',
      syllabus = [],
      resources = [],
      notes = '',
      is_verified = 0,
      source = 'User Added'
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Company name and category are required' });
    }

    const companyId = customId || ('comp_' + Date.now() + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15));
    const initials = logo_initials || name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();
    const initialHistory = [
      { timestamp: new Date().toISOString(), stage: stage_status, note: activity_note }
    ];

    await query(`
      INSERT INTO companies
        (id, name, logo_initials, category, roles_json, eligibility_json,
         restrictions, registration_deadline, assessment_date, interview_dates,
         opportunity_url, stage_status, activity_history_json, syllabus_json,
         resources_json, notes, is_verified, source)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    `, [
      companyId, name, initials, category,
      JSON.stringify(roles), JSON.stringify(eligibility),
      restrictions, registration_deadline || null, assessment_date || null, interview_dates || null,
      opportunity_url, stage_status, JSON.stringify(initialHistory), JSON.stringify(syllabus),
      JSON.stringify(resources), notes, is_verified ? 1 : 0, source
    ]);

    res.json({ success: true, companyId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const {
      name, logo_initials, category, roles, eligibility,
      restrictions, registration_deadline, assessment_date, interview_dates,
      opportunity_url, stage_status, syllabus, resources, notes, is_verified, source
    } = req.body;

    const existing = await queryOne('SELECT * FROM companies WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Company not found' });

    let history = JSON.parse(existing.activity_history_json || '[]');
    if (stage_status && stage_status !== existing.stage_status) {
      history.push({
        timestamp: new Date().toISOString(),
        stage: stage_status,
        note: req.body.status_note || `Stage updated to ${stage_status}`
      });
    }

    await query(`
      UPDATE companies SET
        name = COALESCE($1, name),
        logo_initials = COALESCE($2, logo_initials),
        category = COALESCE($3, category),
        roles_json = COALESCE($4, roles_json),
        eligibility_json = COALESCE($5, eligibility_json),
        restrictions = COALESCE($6, restrictions),
        registration_deadline = COALESCE($7, registration_deadline),
        assessment_date = COALESCE($8, assessment_date),
        interview_dates = COALESCE($9, interview_dates),
        opportunity_url = COALESCE($10, opportunity_url),
        stage_status = COALESCE($11, stage_status),
        activity_history_json = $12,
        syllabus_json = COALESCE($13, syllabus_json),
        resources_json = COALESCE($14, resources_json),
        notes = COALESCE($15, notes),
        is_verified = COALESCE($16, is_verified),
        source = COALESCE($17, source),
        updated_at = NOW()
      WHERE id = $18
    `, [
      name, logo_initials, category,
      roles ? JSON.stringify(roles) : null,
      eligibility ? JSON.stringify(eligibility) : null,
      restrictions, registration_deadline, assessment_date, interview_dates,
      opportunity_url, stage_status, JSON.stringify(history),
      syllabus ? JSON.stringify(syllabus) : null,
      resources ? JSON.stringify(resources) : null,
      notes, is_verified !== undefined ? (is_verified ? 1 : 0) : null, source,
      req.params.id
    ]);

    res.json({ success: true, message: 'Company updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies/:id/stage', async (req, res) => {
  try {
    const { stage_status, note = '' } = req.body;
    if (!stage_status) return res.status(400).json({ error: 'stage_status is required' });

    const existing = await queryOne('SELECT activity_history_json FROM companies WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Company not found' });

    const history = JSON.parse(existing.activity_history_json || '[]');
    history.push({
      timestamp: new Date().toISOString(),
      stage: stage_status,
      note: note || `Stage updated to ${stage_status}`
    });

    await query(`
      UPDATE companies SET
        stage_status = $1,
        activity_history_json = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [stage_status, JSON.stringify(history), req.params.id]);

    res.json({ success: true, stage_status, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    if (req.params.id === 'ril_get_2027') {
      return res.status(400).json({ error: 'The primary preloaded company track cannot be deleted' });
    }
    const { rowCount } = await query('DELETE FROM companies WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Company not found' });
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/companies-export', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM companies ORDER BY created_at ASC');
    const formatted = rows.map(r => ({
      ...r,
      roles: JSON.parse(r.roles_json || '[]'),
      eligibility: JSON.parse(r.eligibility_json || '{}'),
      activity_history: JSON.parse(r.activity_history_json || '[]'),
      syllabus: JSON.parse(r.syllabus_json || '[]'),
      resources: JSON.parse(r.resources_json || '[]'),
    }));
    res.setHeader('Content-Disposition', 'attachment; filename="jobprep_companies.json"');
    res.json({ version: '1.0', export_date: new Date().toISOString(), companies: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies-import', async (req, res) => {
  try {
    const { companies } = req.body;
    if (!Array.isArray(companies)) {
      return res.status(400).json({ error: 'Expected an array of companies' });
    }
    let imported = 0;
    for (const c of companies) {
      if (!c.id || !c.name) continue;
      await query(`
        INSERT INTO companies
          (id, name, logo_initials, category, roles_json, eligibility_json,
           restrictions, registration_deadline, assessment_date, interview_dates,
           opportunity_url, stage_status, activity_history_json, syllabus_json,
           resources_json, notes, is_verified, source)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT(id) DO UPDATE SET
          name = EXCLUDED.name,
          logo_initials = EXCLUDED.logo_initials,
          category = EXCLUDED.category,
          roles_json = EXCLUDED.roles_json,
          eligibility_json = EXCLUDED.eligibility_json,
          restrictions = EXCLUDED.restrictions,
          registration_deadline = EXCLUDED.registration_deadline,
          assessment_date = EXCLUDED.assessment_date,
          interview_dates = EXCLUDED.interview_dates,
          opportunity_url = EXCLUDED.opportunity_url,
          stage_status = EXCLUDED.stage_status,
          activity_history_json = EXCLUDED.activity_history_json,
          syllabus_json = EXCLUDED.syllabus_json,
          resources_json = EXCLUDED.resources_json,
          notes = EXCLUDED.notes,
          is_verified = EXCLUDED.is_verified,
          source = EXCLUDED.source,
          updated_at = NOW()
      `, [
        c.id, c.name, c.logo_initials || 'CO', c.category || 'General',
        JSON.stringify(c.roles || []), JSON.stringify(c.eligibility || {}),
        c.restrictions || '', c.registration_deadline || null, c.assessment_date || null, c.interview_dates || null,
        c.opportunity_url || '', c.stage_status || 'interested', JSON.stringify(c.activity_history || []),
        JSON.stringify(c.syllabus || []), JSON.stringify(c.resources || []), c.notes || '',
        c.is_verified ? 1 : 0, c.source || 'Imported'
      ]);
      imported++;
    }
    res.json({ success: true, count: imported, message: `Successfully imported ${imported} companies` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deterministic Study Plan Reschedule (No AI dependency)
app.post('/api/study-plan/reschedule', async (req, res) => {
  try {
    const { targetDate } = req.body;
    const { rows: pendingTasks } = await query(
      "SELECT * FROM study_tasks WHERE status != 'completed' ORDER BY date ASC, task_index ASC"
    );

    if (pendingTasks.length === 0) {
      return res.json({ success: true, message: 'All tasks completed! Nothing to reschedule.' });
    }

    const today = new Date();
    const end = targetDate ? new Date(targetDate) : new Date(Date.now() + 14 * 86400000);
    const dayDiff = Math.max(1, Math.round((end - today) / (1000 * 60 * 60 * 24)));

    const tasksPerDay = Math.ceil(pendingTasks.length / dayDiff);
    let currentDayOffset = 0;
    let dayTaskCount = 0;

    for (const t of pendingTasks) {
      const targetDay = new Date(today.getTime() + currentDayOffset * 86400000);
      const dateStr = targetDay.toISOString().split('T')[0];

      await query(
        'UPDATE study_tasks SET date = $1, task_index = $2, updated_at = NOW() WHERE id = $3',
        [dateStr, dayTaskCount, t.id]
      );

      dayTaskCount++;
      if (dayTaskCount >= tasksPerDay && currentDayOffset < dayDiff - 1) {
        currentDayOffset++;
        dayTaskCount = 0;
      }
    }

    res.json({ success: true, rescheduledCount: pendingTasks.length, daysCount: currentDayOffset + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Universal Practice Categories
app.get('/api/practice/categories', async (req, res) => {
  try {
    const { rows: qRows } = await query('SELECT id, track, topic, difficulty FROM questions WHERE is_active = 1');
    const { rows: aRows } = await query('SELECT question_id, is_correct FROM question_attempts');

    const attemptMap = {};
    for (const a of aRows) {
      if (!attemptMap[a.question_id]) attemptMap[a.question_id] = { attempted: 0, correct: 0 };
      attemptMap[a.question_id].attempted++;
      if (a.is_correct) attemptMap[a.question_id].correct++;
    }

    const categories = [
      { id: 'quantitative_aptitude', title: 'Quantitative Aptitude', track: 'cognitive', matchTopics: ['Quantitative Aptitude', 'Arithmetic', 'Speed', 'Profit', 'Ratio', 'Algebra', 'Number', 'Percentages', 'Time and Work'] },
      { id: 'logical_reasoning', title: 'Logical Reasoning', track: 'cognitive', matchTopics: ['Logical Reasoning', 'Deductive', 'Series', 'Pattern', 'Arrangement', 'Syllogism', 'Blood', 'Direction', 'Coding'] },
      { id: 'visual_reasoning', title: 'Visual & Non-Verbal Aptitude', track: 'cognitive', matchTopics: ['Visual', 'Figure', 'Rotation', 'Matrix', 'Folding', 'Cutting', 'Dice', 'Mirror', 'Water', 'Embedded', 'Classification', 'Spatial', 'Sequences'] },
      { id: 'verbal_ability', title: 'Verbal Ability', track: 'cognitive', matchTopics: ['Verbal Ability', 'Sentence', 'Reading', 'Vocabulary', 'Grammar', 'Comprehension'] },
      { id: 'data_interpretation', title: 'Data Interpretation', track: 'cognitive', matchTopics: ['Data Interpretation', 'Chart', 'Graph', 'Table'] },
      { id: 'instrumentation', title: 'Sensors & Transducers', track: 'instrumentation', matchTopics: ['Sensors', 'Transducers', 'Measurement', 'Flow', 'Level', 'Pressure', 'Temperature', 'Signals'] },
      { id: 'process_control', title: 'Process Control & Industrial Automation', track: 'instrumentation', matchTopics: ['Process Control', 'PID', 'Signal Conditioning', 'PLC', 'DCS', 'Analytical', 'Control Valves'] },
      { id: 'tech_fundamentals', title: 'Technical Fundamentals & Electronics', track: 'instrumentation', matchTopics: ['Basic Electronics', 'Control Systems', 'Digital Logic', 'Circuits', 'Industrial'] },
    ];

    const result = categories.map(cat => {
      const catQuestions = qRows.filter(q => {
        if (cat.id === 'visual_reasoning') {
          return q.id.startsWith('vis_') || cat.matchTopics.some(mt => q.topic.toLowerCase().includes(mt.toLowerCase()));
        }
        if (cat.track && q.track.toLowerCase() === cat.track.toLowerCase() && !q.id.startsWith('vis_')) {
          return cat.matchTopics.some(mt => q.topic.toLowerCase().includes(mt.toLowerCase()));
        }
        return false;
      });

      let totalAttempted = 0;
      let totalCorrect = 0;
      for (const q of catQuestions) {
        if (attemptMap[q.id]) {
          totalAttempted += attemptMap[q.id].attempted;
          totalCorrect += attemptMap[q.id].correct;
        }
      }

      return {
        id: cat.id,
        title: cat.title,
        track: cat.track,
        questionCount: catQuestions.length,
        attemptedCount: totalAttempted,
        accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
        topics: [...new Set(catQuestions.map(q => q.topic))]
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Mistake Notebook
app.get('/api/mistakes', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT m.*, q.track, q.topic, q.difficulty, q.question, q.options_json, q.correct_option_id, q.correct_answer, q.explanation
      FROM mistake_notebook m
      JOIN questions q ON m.question_id = q.id
      ORDER BY m.is_resolved ASC, m.last_failed_at DESC
    `);
    res.json(rows.map(r => ({ ...r, options: JSON.parse(r.options_json) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mistakes/:id', async (req, res) => {
  try {
    const { error_category, personal_notes, is_resolved } = req.body;
    await query(`
      UPDATE mistake_notebook SET
        error_category = COALESCE($1, error_category),
        personal_notes = COALESCE($2, personal_notes),
        is_resolved    = COALESCE($3, is_resolved),
        updated_at     = NOW()
      WHERE question_id = $4
    `, [error_category, personal_notes, is_resolved, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mistakes/resolve', async (req, res) => {
  try {
    const { question_id, date = new Date().toISOString().split('T')[0] } = req.body;
    await query('UPDATE mistake_notebook SET is_resolved = 1, updated_at = NOW() WHERE question_id = $1', [question_id]);

    const todayRow = await queryOne(
      "SELECT COALESCE(SUM(xp_awarded),0) AS total FROM xp_events WHERE date = $1 AND action_type = 'mistake_reviewed'",
      [date]
    );
    let xpAwarded = 0;
    if (parseInt(todayRow?.total ?? 0, 10) < 20) {
      const xp = await awardXP(date, 'mistake_reviewed', 2, `mistake_${question_id}_${date}_review`, { question_id });
      xpAwarded = xp.awarded;
    }
    await evaluateAchievements();
    res.json({ success: true, xpAwarded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. XP & Streaks
app.get('/api/xp-streak', async (req, res) => {
  try {
    const xpRow = await queryOne('SELECT COALESCE(SUM(xp_awarded),0) AS total FROM xp_events');
    const totalXP = parseInt(xpRow?.total ?? 0, 10);

    const levels = [
      { level: 1, title: 'Novice Cadet',           threshold: 0,    next: 100  },
      { level: 2, title: 'Apprentice Engineer',     threshold: 100,  next: 250  },
      { level: 3, title: 'Calibration Specialist',  threshold: 250,  next: 500  },
      { level: 4, title: 'Control Room Operator',   threshold: 500,  next: 850  },
      { level: 5, title: 'Automation Lead',         threshold: 850,  next: 1300 },
      { level: 6, title: 'Process Architect',       threshold: 1300, next: 1900 },
      { level: 7, title: 'Chief Systems Engineer',  threshold: 1900, next: 2700 },
      { level: 8, title: 'RIL GET Grandmaster',     threshold: 2700, next: 4000 },
    ];

    let currentLevel = levels[0];
    for (const l of levels) if (totalXP >= l.threshold) currentLevel = l;

    const xpInLevel = totalXP - currentLevel.threshold;
    const levelSpan = currentLevel.next - currentLevel.threshold;
    const levelProgressPct = Math.min(100, Math.round((xpInLevel / levelSpan) * 100));

    const { rows: activities } = await query(
      'SELECT date, qualified_streak, total_active_seconds, questions_attempted FROM daily_activity ORDER BY date ASC'
    );

    let currentStreak = 0, longestStreak = 0, tempStreak = 0;
    for (const a of activities) {
      if (a.qualified_streak === 1 || a.qualified_streak === true) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActive = activities.filter(a => a.qualified_streak === 1 || a.qualified_streak === true);
    if (lastActive.length > 0) {
      const lastDate = lastActive[lastActive.length - 1].date;
      const diffDays = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
      currentStreak = diffDays <= 1 ? tempStreak : 0;
    }

    const { rows: recentEvents } = await query('SELECT * FROM xp_events ORDER BY created_at DESC LIMIT 15');

    res.json({
      totalXP, level: currentLevel.level, title: currentLevel.title,
      threshold: currentLevel.threshold, nextThreshold: currentLevel.next,
      progressPct: levelProgressPct, currentStreak, longestStreak,
      activityCalendar: activities, recentEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Achievements
app.get('/api/achievements', async (req, res) => {
  try {
    res.json(await evaluateAchievements());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Daily & Cumulative Reports
app.get('/api/reports/daily', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const { rows: tasks } = await query('SELECT * FROM study_tasks WHERE date = $1 ORDER BY task_index ASC', [date]);
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const tasksRemaining = tasks.filter(t => t.status !== 'completed' && t.status !== 'skipped').length;
    const adherence = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

    const secsRow = await queryOne('SELECT COALESCE(SUM(duration_seconds),0) AS total FROM study_sessions WHERE date = $1', [date]);
    const measuredSecs = parseInt(secsRow?.total ?? 0, 10);

    const { rows: attempts } = await query('SELECT * FROM question_attempts WHERE date = $1', [date]);
    const attemptedCount = attempts.length;
    const correctCount   = attempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const totalTimeSpent = attempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
    const avgTimePerQuestion = attemptedCount > 0 ? Math.round(totalTimeSpent / attemptedCount) : 0;

    const cogAttempts  = attempts.filter(a => a.track === 'cognitive');
    const cogCorrect   = cogAttempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const cogAccuracy  = cogAttempts.length > 0 ? Math.round((cogCorrect / cogAttempts.length) * 100) : 0;
    const instAttempts = attempts.filter(a => a.track === 'instrumentation');
    const instCorrect  = instAttempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const instAccuracy = instAttempts.length > 0 ? Math.round((instCorrect / instAttempts.length) * 100) : 0;

    const topicMap = {};
    for (const a of attempts) {
      if (!topicMap[a.topic]) topicMap[a.topic] = { topic: a.topic, track: a.track, attempted: 0, correct: 0 };
      topicMap[a.topic].attempted++;
      if (a.is_correct === 1 || a.is_correct === true) topicMap[a.topic].correct++;
    }
    const topicBreakdown = Object.values(topicMap).map(t => ({
      ...t,
      accuracy: Math.round((t.correct / t.attempted) * 100),
      isPreliminary: t.attempted < 3,
    }));

    const { rows: mocks } = await query(
      'SELECT id,title,test_type,total_questions,attempted,correct,accuracy,time_taken_seconds FROM test_runs WHERE date = $1',
      [date]
    );
    const dailyXPRow = await queryOne('SELECT COALESCE(SUM(xp_awarded),0) AS total FROM xp_events WHERE date = $1', [date]);
    const dailyXP = parseInt(dailyXPRow?.total ?? 0, 10);
    const streakRecord = await queryOne('SELECT * FROM daily_activity WHERE date = $1', [date]);

    res.json({
      date, tasksPlanned: tasks.length, tasksCompleted, tasksRemaining,
      planAdherencePct: adherence, tasksList: tasks,
      measuredStudyMins: Math.round(measuredSecs / 60),
      questionsAttempted: attemptedCount, questionsCorrect: correctCount,
      accuracy, avgTimePerQuestion,
      cognitive:       { attempted: cogAttempts.length,  correct: cogCorrect,  accuracy: cogAccuracy },
      instrumentation: { attempted: instAttempts.length, correct: instCorrect, accuracy: instAccuracy },
      topicBreakdown, mocks, dailyXP,
      qualifiedStreak: Boolean(streakRecord && (streakRecord.qualified_streak === 1 || streakRecord.qualified_streak === true)),
      recommendations: generateRecommendations(topicBreakdown),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/cumulative', async (req, res) => {
  try {
    const upToDate = req.query.date || new Date().toISOString().split('T')[0];
    const { rows: tasks } = await query('SELECT * FROM study_tasks WHERE date <= $1', [upToDate]);
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const adherence = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

    const secsRow = await queryOne('SELECT COALESCE(SUM(duration_seconds),0) AS total FROM study_sessions WHERE date <= $1', [upToDate]);
    const totalStudySecs = parseInt(secsRow?.total ?? 0, 10);

    const { rows: attempts } = await query('SELECT * FROM question_attempts WHERE date <= $1', [upToDate]);
    const totalAttempted = attempts.length;
    const totalCorrect   = attempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const cumulativeAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
    const totalTimeSpent = attempts.reduce((acc, a) => acc + (a.time_spent_seconds || 0), 0);
    const avgTimePerQuestion = totalAttempted > 0 ? Math.round(totalTimeSpent / totalAttempted) : 0;

    const cogAttempts  = attempts.filter(a => a.track === 'cognitive');
    const cogCorrect   = cogAttempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const cogAccuracy  = cogAttempts.length > 0 ? Math.round((cogCorrect / cogAttempts.length) * 100) : 0;
    const instAttempts = attempts.filter(a => a.track === 'instrumentation');
    const instCorrect  = instAttempts.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const instAccuracy = instAttempts.length > 0 ? Math.round((instCorrect / instAttempts.length) * 100) : 0;

    const topicMap = {};
    for (const a of attempts) {
      if (!topicMap[a.topic]) topicMap[a.topic] = { topic: a.topic, track: a.track, attempted: 0, correct: 0 };
      topicMap[a.topic].attempted++;
      if (a.is_correct === 1 || a.is_correct === true) topicMap[a.topic].correct++;
    }
    const topicBreakdown = Object.values(topicMap).map(t => ({
      ...t, accuracy: Math.round((t.correct / t.attempted) * 100), isPreliminary: t.attempted < 3,
    })).sort((a, b) => b.attempted - a.attempted);

    const xpRow = await queryOne('SELECT COALESCE(SUM(xp_awarded),0) AS total FROM xp_events WHERE date <= $1', [upToDate]);
    const cumulativeXP = parseInt(xpRow?.total ?? 0, 10);
    const activeDaysRow = await queryOne('SELECT COUNT(*) AS count FROM daily_activity WHERE date <= $1 AND qualified_streak = 1', [upToDate]);
    const activeDays = parseInt(activeDaysRow?.count ?? 0, 10);

    res.json({
      upToDate, totalDaysRecorded: activeDays,
      totalPlannedTasks: tasks.length, totalCompletedTasks: tasksCompleted,
      planAdherencePct: adherence, totalStudyMins: Math.round(totalStudySecs / 60),
      totalQuestionsAttempted: totalAttempted, totalQuestionsCorrect: totalCorrect,
      cumulativeAccuracy, avgTimePerQuestion,
      cognitive:       { attempted: cogAttempts.length,  correct: cogCorrect,  accuracy: cogAccuracy },
      instrumentation: { attempted: instAttempts.length, correct: instCorrect, accuracy: instAccuracy },
      topicBreakdown, cumulativeXP,
      strongestTopics: topicBreakdown.filter(t => t.attempted >= 3 && t.accuracy >= 75).slice(0, 3),
      weakestTopics:   topicBreakdown.filter(t => t.attempted >= 3 && t.accuracy < 70).slice(0, 3),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateRecommendations(topics) {
  const weak = topics.filter(t => t.accuracy < 70);
  if (weak.length === 0) return ['Excellent progress! Proceed with the scheduled timed mixed simulation.'];
  return weak.slice(0, 3).map(w =>
    `Revise ${w.topic} (${w.accuracy}% accuracy across ${w.attempted} questions). Run a focused 10-question drill.`
  );
}

// 11. Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const { rows: dates } = await query(
      'SELECT date, COUNT(*) AS attempted, SUM(is_correct::int) AS correct FROM question_attempts GROUP BY date ORDER BY date ASC'
    );
    const accuracyTrend = dates.map(d => ({
      date: d.date, attempted: parseInt(d.attempted, 10),
      correct: parseInt(d.correct, 10),
      accuracy: parseInt(d.attempted, 10) > 0 ? Math.round((parseInt(d.correct, 10) / parseInt(d.attempted, 10)) * 100) : 0,
    }));

    const { rows: topicsRaw } = await query(
      'SELECT topic, track, COUNT(*) AS attempted, SUM(is_correct::int) AS correct, AVG(time_spent_seconds) AS avg_seconds FROM question_attempts GROUP BY topic, track ORDER BY attempted DESC'
    );
    const topics = topicsRaw.map(t => ({
      topic: t.topic, track: t.track,
      attempted: parseInt(t.attempted, 10), correct: parseInt(t.correct, 10),
      accuracy: Math.round((parseInt(t.correct, 10) / parseInt(t.attempted, 10)) * 100),
      avgSeconds: Math.round(parseFloat(t.avg_seconds || 0)),
      isPreliminary: parseInt(t.attempted, 10) < 3,
    }));

    const { rows: studyTimeByDate } = await query(
      'SELECT date, COALESCE(SUM(duration_seconds),0) / 60 AS measured_mins FROM study_sessions GROUP BY date ORDER BY date ASC'
    );
    const { rows: mockScores } = await query(
      'SELECT id,title,date,score,accuracy,total_questions,created_at FROM test_runs ORDER BY created_at ASC'
    );

    res.json({ accuracyTrend, topics, studyTimeByDate, mockScores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Sources Register
app.get('/api/sources', (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(rootDir, 'sources.json'), 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sources/check-links', async (req, res) => {
  const { urls } = req.body;
  const results = {};
  for (const url of urls || []) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      results[url] = { status: resp.status, ok: resp.ok };
    } catch (err) {
      results[url] = { status: 0, ok: false, error: err.message };
    }
  }
  res.json(results);
});

// 13. QA Validator
app.get('/api/qa/validate-bank', async (req, res) => {
  try {
    const { rows: questions } = await query('SELECT * FROM questions WHERE is_active = 1');
    const errors = [];
    const ids = new Set(), prompts = new Set();
    for (const q of questions) {
      if (ids.has(q.id)) errors.push(`Duplicate ID: ${q.id}`);
      ids.add(q.id);
      const normPrompt = q.question.trim().toLowerCase();
      if (prompts.has(normPrompt)) errors.push(`Duplicate prompt for ID ${q.id}`);
      prompts.add(normPrompt);
      const opts = JSON.parse(q.options_json);
      if (!Array.isArray(opts) || opts.length !== 4) errors.push(`Question ${q.id} does not have exactly 4 options`);
      else if (!opts.map(o => o.id).includes(q.correct_option_id)) errors.push(`Question ${q.id} correct_option_id not in options`);
      if (!q.explanation || q.explanation.trim().length === 0) errors.push(`Question ${q.id} missing explanation`);
    }
    res.json({
      totalQuestions: questions.length, valid: errors.length === 0,
      errorsCount: errors.length, errors,
      cognitiveCount: questions.filter(q => q.track === 'cognitive').length,
      instrumentationCount: questions.filter(q => q.track === 'instrumentation').length,
      difficulties: {
        easy:   questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard:   questions.filter(q => q.difficulty === 'hard').length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. AI Question Lab
app.get('/api/ai/status', async (req, res) => {
  try {
    res.json(await getAiStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/generate', async (req, res) => {
  try {
    const results = await generatePracticeQuestions(req.body);
    res.json({ success: true, count: results.length, questions: results });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/approve/:id', async (req, res) => {
  try {
    res.json(await approveQuestion(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/ai/reject/:id', async (req, res) => {
  try {
    res.json(await rejectQuestion(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 15. Export & Import
app.get('/api/export', async (req, res) => {
  try {
    const profile      = await queryOne('SELECT * FROM learner_profile WHERE id = 1');
    const { rows: tasks }    = await query('SELECT * FROM study_tasks');
    const { rows: sessions } = await query('SELECT * FROM study_sessions');
    const { rows: testRuns } = await query('SELECT * FROM test_runs');
    const { rows: attempts } = await query('SELECT * FROM question_attempts');
    const { rows: mistakes } = await query('SELECT * FROM mistake_notebook');
    const { rows: xp }       = await query('SELECT * FROM xp_events');
    const { rows: activity } = await query('SELECT * FROM daily_activity');
    const { rows: achievements } = await query('SELECT * FROM user_achievements');

    const payload = {
      exportedAt: new Date().toISOString(), version: '1.0.0',
      profile, tasks, sessions, testRuns, attempts, mistakes, xp, activity, achievements,
    };
    res.setHeader('Content-Disposition', 'attachment; filename=get_quest_backup.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.version) return res.status(400).json({ error: 'Invalid backup file format.' });

    if (payload.profile) {
      await query(
        'UPDATE learner_profile SET name=$1,branch=$2,target_date=$3,daily_goal_mins=$4,daily_goal_questions=$5 WHERE id=1',
        [payload.profile.name, payload.profile.branch, payload.profile.target_date, payload.profile.daily_goal_mins, payload.profile.daily_goal_questions]
      );
    }
    if (Array.isArray(payload.tasks)) {
      for (const t of payload.tasks) {
        await query('UPDATE study_tasks SET status=$1,actual_minutes=$2,notes=$3,completed_at=$4 WHERE id=$5',
          [t.status, t.actual_minutes, t.notes, t.completed_at, t.id]);
      }
    }
    if (Array.isArray(payload.mistakes)) {
      for (const m of payload.mistakes) {
        await query(
          'INSERT INTO mistake_notebook (question_id,first_failed_at,last_failed_at,retry_count,consecutive_correct,is_resolved,error_category,personal_notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(question_id) DO UPDATE SET retry_count=EXCLUDED.retry_count,consecutive_correct=EXCLUDED.consecutive_correct,is_resolved=EXCLUDED.is_resolved,error_category=EXCLUDED.error_category,personal_notes=EXCLUDED.personal_notes',
          [m.question_id, m.first_failed_at, m.last_failed_at, m.retry_count, m.consecutive_correct, m.is_resolved, m.error_category, m.personal_notes]
        );
      }
    }
    if (Array.isArray(payload.xp)) {
      for (const x of payload.xp) {
        await query('INSERT INTO xp_events (id,date,action_type,xp_awarded,metadata_json) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING',
          [x.id, x.date, x.action_type, x.xp_awarded, x.metadata_json]);
      }
    }
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (err) {
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// 16. Reset progress
app.post('/api/reset-progress', async (req, res) => {
  try {
    await query('DELETE FROM question_attempts');
    await query('DELETE FROM test_runs');
    await query('DELETE FROM mistake_notebook');
    await query('DELETE FROM study_sessions');
    await query('DELETE FROM xp_events');
    await query('DELETE FROM daily_activity');
    await query('DELETE FROM user_achievements');
    await query("UPDATE study_tasks SET status='not_started',actual_minutes=0,notes='',score_verified=0,completed_at=NULL");
    res.json({ success: true, message: 'User progress reset. Question bank remains intact.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset-bank', async (req, res) => {
  try {
    const count = await seedQuestions(true);
    res.json({ success: true, count, message: 'Question bank re-seeded.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In production: SPA catch-all (must come after all /api routes)
if (IS_PROD) {
  app.get('*', (req, res) => {
    const indexPath = path.join(rootDir, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).send('Build not found. Run npm run build first.');
    }
  });
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
async function startServer() {
  await initDB();
  await bootstrapAuth();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JobPrep API Server listening on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
