import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Visual reasoning dataset covers all required 20 visual types with valid SVG specifications', () => {
  const raw = fs.readFileSync(path.join(rootDir, 'questions_visual.json'), 'utf8');
  const data = JSON.parse(raw);
  const questions = data.questions;

  assert.ok(questions.length >= 20, `Must have at least 20 visual questions (found: ${questions.length})`);

  const requiredTypes = [
    'increasing_line_count',
    'shape_rotation',
    'polygon_vertex_progression',
    'mirror_reflection',
    'water_image',
    'figure_analogy',
    'matrix_completion_3x3',
    'odd_one_out',
    'paper_folding',
    'paper_cutting',
    'dice_faces',
    'cube_net_folding',
    'count_the_shapes',
    'embedded_figures',
    'figure_classification',
    'spatial_orientation',
    'pattern_transformation',
    'visual_arrangement',
    'mixed_symbol_patterns',
    'two_step_multi_rule'
  ];

  const presentTypes = questions.map(q => q.provenance.type);
  for (const t of requiredTypes) {
    assert.ok(presentTypes.includes(t), `Visual type '${t}' must be present in visual questions`);
  }

  // Verify diagram specs
  for (const q of questions) {
    const spec = q.diagram_spec;
    assert.ok(spec, `Question ${q.id} must have diagram_spec`);
    assert.ok(spec.aria_label && spec.aria_label.length > 5, `Question ${q.id} must have descriptive aria_label`);
    assert.ok(spec.rule_explanation && spec.rule_explanation.length > 5, `Question ${q.id} must have rule_explanation`);

    // Must have prompt frames, fold steps, or matrix cells
    const hasRenderableElements = 
      (spec.prompt_frames && spec.prompt_frames.length > 0) ||
      (spec.matrix_cells && spec.matrix_cells.length > 0) ||
      (spec.fold_steps && spec.fold_steps.length > 0) ||
      (spec.left_figure && spec.left_figure.shapes.length > 0);

    assert.ok(hasRenderableElements, `Question ${q.id} must have valid renderable vector elements`);

    // Verify deterministic options mapping
    assert.equal(q.options.length, 4, `Question ${q.id} must have 4 options`);
    const validCorrect = q.options.some(o => o.id === q.correct_option_id && o.text.trim() === q.correct_answer.trim());
    assert.ok(validCorrect, `Question ${q.id} correct answer must match option text`);
  }
});
