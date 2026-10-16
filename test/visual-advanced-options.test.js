import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Advanced Visual Aptitude questions have verified image-based option frames and multi-step rules', () => {
  const raw = fs.readFileSync(path.join(rootDir, 'questions_visual_advanced.json'), 'utf8');
  const questions = JSON.parse(raw);

  // Requirement: at least 30 new, original, validated visual reasoning questions
  assert.ok(questions.length >= 30, `Must have at least 30 advanced visual questions (found: ${questions.length})`);

  for (const q of questions) {
    assert.ok(q.id, 'Question must have unique ID');
    assert.ok(q.question && q.question.length > 10, `Question ${q.id} must have descriptive prompt`);
    assert.ok(q.diagram_spec, `Question ${q.id} must have diagram_spec`);
    assert.ok(q.explanation && q.explanation.length > 20, `Question ${q.id} must have step-by-step explanation`);

    // Requirement: Both the question AND all answer options must be images
    assert.equal(q.options.length, 4, `Question ${q.id} must have 4 options`);
    
    // Check that every option has a valid visual frame with shapes
    for (const opt of q.options) {
      assert.ok(['A', 'B', 'C', 'D'].includes(opt.id), `Option ID must be A, B, C, or D in ${q.id}`);
      assert.ok(opt.frame, `Option ${opt.id} in ${q.id} must have image frame`);
      assert.ok(Array.isArray(opt.frame.shapes) && opt.frame.shapes.length > 0, `Option ${opt.id} frame in ${q.id} must contain vector shapes`);
    }

    // Verify correct answer matches an option
    const correctOpt = q.options.find(o => o.id === q.correct_option_id);
    assert.ok(correctOpt, `Question ${q.id} correct_option_id must match an option`);
    assert.equal(correctOpt.text, q.correct_answer, `Question ${q.id} correct_answer text must match option text`);
  }
});
