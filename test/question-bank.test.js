import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Question Bank conforms strictly to schema and integrity constraints', () => {
  const raw = fs.readFileSync(path.join(rootDir, 'question_bank.json'), 'utf8');
  const data = JSON.parse(raw);

  assert.equal(data.questions.length, 105, 'Total questions must be exactly 105');

  const ids = new Set();
  const prompts = new Set();
  let cognitiveCount = 0;
  let instrumentationCount = 0;

  for (const q of data.questions) {
    // Unique ID
    assert.ok(q.id && typeof q.id === 'string', 'ID must be non-empty string');
    assert.ok(!ids.has(q.id), `Duplicate ID found: ${q.id}`);
    ids.add(q.id);

    // Track
    assert.ok(q.track === 'cognitive' || q.track === 'instrumentation', `Invalid track: ${q.track}`);
    if (q.track === 'cognitive') cognitiveCount++;
    if (q.track === 'instrumentation') instrumentationCount++;

    // Topic & Difficulty
    assert.ok(q.topic && q.topic.trim().length > 0, `Topic required for ${q.id}`);
    assert.ok(['easy', 'medium', 'hard'].includes(q.difficulty), `Invalid difficulty for ${q.id}`);

    // Prompt
    assert.ok(q.question && q.question.trim().length > 0, `Question prompt required for ${q.id}`);
    const norm = q.question.trim().toLowerCase();
    assert.ok(!prompts.has(norm), `Duplicate question prompt found for ${q.id}`);
    prompts.add(norm);

    // Options
    assert.ok(Array.isArray(q.options), `Options must be array for ${q.id}`);
    assert.equal(q.options.length, 4, `Question ${q.id} must have exactly 4 options`);
    const optIds = q.options.map((o) => o.id);
    assert.deepEqual(optIds, ['A', 'B', 'C', 'D'], `Options must be labeled A, B, C, D in ${q.id}`);

    // Correct Option ID & Answer
    assert.ok(['A', 'B', 'C', 'D'].includes(q.correct_option_id), `Invalid correct_option_id for ${q.id}`);
    const matchedOpt = q.options.find((o) => o.id === q.correct_option_id);
    assert.ok(matchedOpt, `Correct option not found in options array for ${q.id}`);
    assert.equal(matchedOpt.text.trim(), q.correct_answer.trim(), `correct_answer text mismatch in ${q.id}`);

    // Explanation
    assert.ok(q.explanation && q.explanation.trim().length > 0, `Missing explanation in ${q.id}`);
  }

  assert.equal(cognitiveCount, 35, 'Must have exactly 35 cognitive questions');
  assert.equal(instrumentationCount, 70, 'Must have exactly 70 instrumentation questions');
});
