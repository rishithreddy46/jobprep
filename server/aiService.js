/**
 * aiService.js — AI Question Lab (optional feature)
 * Fully async; uses unified query() from db.js (works with both PostgreSQL and SQLite)
 */
import { query, queryOne } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

export async function getAiStatus() {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  const provider = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'none');
  const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'none');

  const pendingRow  = await queryOne("SELECT COUNT(*) AS count FROM ai_generated_questions WHERE status = 'pending_review'");
  const approvedRow = await queryOne("SELECT COUNT(*) AS count FROM ai_generated_questions WHERE status = 'approved'");

  return {
    enabled: Boolean(apiKey),
    provider,
    model,
    pendingCount:  parseInt(pendingRow?.count ?? 0, 10),
    approvedCount: parseInt(approvedRow?.count ?? 0, 10),
    notice: 'AI-generated questions are original practice items and must be reviewed before admission into active mocks. Never label them as real previous-year RIL questions.',
  };
}

export async function generatePracticeQuestions({ track = 'instrumentation', topic = 'Flow Measurement', difficulty = 'medium', count = 1 }) {
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('AI Question Lab is running in offline mode. Set AI_API_KEY in environment variables to enable practice question generation.');
  }

  const prompt = `You are an expert engineering assessment designer for Electronics & Instrumentation Engineering.
Generate ${count} original multiple-choice practice question(s) for the topic "${topic}" in track "${track}" at difficulty "${difficulty}".
CRITICAL REQUIREMENTS:
- Do NOT replicate copyrighted questions or claim these are real/leaked RIL questions.
- Must test fundamental engineering principles, practical calculations, or industrial measurement concepts.
- Provide exactly 4 distinct options (labeled A, B, C, D).
- Specify the correct_option_id ('A', 'B', 'C', or 'D') and matching correct_answer text.
- Provide a rigorous, educational step-by-step explanation.
- Return ONLY a valid JSON array of objects conforming to this format:
[
  {
    "track": "${track}",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "question": "Clear problem statement",
    "options": [
      {"id": "A", "text": "Option A"},
      {"id": "B", "text": "Option B"},
      {"id": "C", "text": "Option C"},
      {"id": "D", "text": "Option D"}
    ],
    "correct_option_id": "A",
    "correct_answer": "Option A",
    "explanation": "Detailed explanation...",
    "recommended_time_seconds": 60
  }
]`;

  let generatedItems = [];
  const provider = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai');

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Gemini API Error');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    generatedItems = JSON.parse(text);
  } else {
    const url = 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'OpenAI API Error');
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    generatedItems = Array.isArray(parsed) ? parsed : (parsed.questions || [parsed]);
  }

  const results = [];
  for (const item of generatedItems) {
    const qid = `AI_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await query(`
      INSERT INTO ai_generated_questions
        (id, track, topic, difficulty, question, options_json, correct_option_id,
         correct_answer, explanation, recommended_time_seconds, status, provider_model)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_review',$11)
    `, [
      qid,
      item.track || track, item.topic || topic, item.difficulty || difficulty,
      item.question, JSON.stringify(item.options), item.correct_option_id,
      item.correct_answer, item.explanation, item.recommended_time_seconds || 60,
      `${provider}:${process.env.AI_MODEL || 'default'}`,
    ]);
    results.push({ id: qid, ...item, status: 'pending_review' });
  }

  return results;
}

export async function approveQuestion(id) {
  const item = await queryOne('SELECT * FROM ai_generated_questions WHERE id = $1', [id]);
  if (!item) throw new Error('Question not found');

  await query("UPDATE ai_generated_questions SET status = 'approved' WHERE id = $1", [id]);

  await query(`
    INSERT INTO questions
      (id, track, topic, difficulty, question, options_json, correct_option_id,
       correct_answer, explanation, recommended_time_seconds, provenance_json, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1)
    ON CONFLICT(id) DO UPDATE SET
      track = EXCLUDED.track, topic = EXCLUDED.topic,
      options_json = EXCLUDED.options_json, is_active = 1
  `, [
    item.id, item.track, item.topic, item.difficulty, item.question,
    item.options_json, item.correct_option_id, item.correct_answer, item.explanation,
    item.recommended_time_seconds,
    JSON.stringify({ kind: 'AI-generated (approved practice item)', model: item.provider_model }),
  ]);

  return { success: true, id };
}

export async function rejectQuestion(id) {
  await query("UPDATE ai_generated_questions SET status = 'rejected' WHERE id = $1", [id]);
  return { success: true, id };
}
