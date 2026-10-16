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

  // Must have at least 105 base questions, now expanded with visual and multi-track questions
  assert.ok(data.questions.length >= 105, `Total questions must be at least 105, found: ${data.questions.length}`);

  const ids = new Set();
  const prompts = new Set();
  let cognitiveCount = 0;
  let instrumentationCount = 0;
  let visualCount = 0;
  let companyTrackCount = 0;

  for (const q of data.questions) {
    // Unique ID
    assert.ok(q.id && typeof q.id === 'string', 'ID must be non-empty string');
    assert.ok(!ids.has(q.id), `Duplicate ID found: ${q.id}`);
    ids.add(q.id);

    // Track
    assert.ok(
      ['cognitive', 'instrumentation', 'company_track', 'verbal', 'quantitative'].includes(q.track),
      `Invalid track: ${q.track} in ${q.id}`
    );
    if (q.track === 'cognitive') cognitiveCount++;
    if (q.track === 'instrumentation') instrumentationCount++;
    if (q.track === 'company_track') companyTrackCount++;
    if (q.id.startsWith('vis_')) visualCount++;

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

    // Visual questions validation
    if (q.id.startsWith('vis_')) {
      assert.ok(q.diagram_spec, `Visual question ${q.id} must have diagram_spec`);
      assert.ok(q.diagram_spec.type, `Visual question ${q.id} must have diagram_spec.type`);
    }
  }

  // Verify counts
  assert.ok(cognitiveCount >= 35, `Must have at least 35 cognitive questions (found ${cognitiveCount})`);
  assert.ok(instrumentationCount >= 70, `Must have at least 70 instrumentation questions (found ${instrumentationCount})`);
  assert.equal(visualCount, 20, 'Must have exactly 20 visual aptitude questions');
  assert.ok(companyTrackCount >= 3, 'Must have company track assessment questions');
});

test('Modular question bank files exist and are valid JSON', () => {
  const files = [
    'questions_visual.json',
    'questions_quantitative.json',
    'questions_logical.json',
    'questions_verbal.json',
    'questions_data_interpretation.json',
    'questions_technical.json',
    'questions_company_tracks.json',
  ];

  for (const f of files) {
    const filePath = path.join(rootDir, f);
    assert.ok(fs.existsSync(filePath), `Modular file must exist: ${f}`);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    assert.ok(Array.isArray(content.questions), `${f} must contain questions array`);
    assert.ok(content.questions.length > 0, `${f} must not be empty`);
  }
});
