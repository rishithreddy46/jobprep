/**
 * scripts/build_question_banks.js
 *
 * Generates modular, versioned question datasets:
 * - questions_visual.json (20 original SVG-ready visual & non-verbal reasoning puzzles)
 * - questions_quantitative.json (Arithmetic, proportions, percentages, time & work)
 * - questions_logical.json (Deduction, series, arrangements, syllogisms)
 * - questions_verbal.json (Comprehension, grammar, sentence completion)
 * - questions_data_interpretation.json (Tables, charts, calculations)
 * - questions_technical.json (Instrumentation, control systems, sensors, automation)
 * - questions_company_tracks.json (RIL GET, L&T GET, TCS Prime specific tracks)
 *
 * Merges everything into master question_bank.json and populates the SQLite database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read existing questions
const existingBank = JSON.parse(fs.readFileSync(path.join(rootDir, 'question_bank.json'), 'utf8'));
const existingQuestions = existingBank.questions || [];

// 2. Define 20 Complete Visual Reasoning Questions with Deterministic SVG Diagram Specs
const visualQuestions = [
  {
    id: "vis_seq_01",
    track: "cognitive",
    topic: "Visual Sequences",
    difficulty: "easy",
    question: "Analyze the sequence of line frames below. What should be the contents of the next frame?",
    options: [
      { id: "A", text: "A frame containing 4 horizontal lines" },
      { id: "B", text: "A frame containing 5 horizontal lines" },
      { id: "C", text: "A frame containing 6 horizontal lines" },
      { id: "D", text: "A frame containing 3 vertical lines" }
    ],
    correct_option_id: "B",
    correct_answer: "A frame containing 5 horizontal lines",
    explanation: "Rule: The number of horizontal lines increases by exactly +1 in each successive frame (Frame 1 = 1, Frame 2 = 2, Frame 3 = 3, Frame 4 = 4). Therefore, the 5th frame must contain 5 equidistant horizontal lines.",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "increasing_line_count", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "A sequence of frames with 1, 2, 3, and 4 horizontal lines respectively",
      rule_explanation: "Line count increases linearly: n -> n + 1",
      prompt_frames: [
        { label: "1", shapes: [{ kind: "line", x1: 20, y1: 50, x2: 80, y2: 50 }] },
        { label: "2", shapes: [{ kind: "line", x1: 20, y1: 40, x2: 80, y2: 40 }, { kind: "line", x1: 20, y1: 60, x2: 80, y2: 60 }] },
        { label: "3", shapes: [{ kind: "line", x1: 20, y1: 30, x2: 80, y2: 30 }, { kind: "line", x1: 20, y1: 50, x2: 80, y2: 50 }, { kind: "line", x1: 20, y1: 70, x2: 80, y2: 70 }] },
        { label: "4", shapes: [{ kind: "line", x1: 20, y1: 25, x2: 80, y2: 25 }, { kind: "line", x1: 20, y1: 41, x2: 80, y2: 41 }, { kind: "line", x1: 20, y1: 58, x2: 80, y2: 58 }, { kind: "line", x1: 20, y1: 75, x2: 80, y2: 75 }] }
      ]
    }
  },
  {
    id: "vis_rot_02",
    track: "cognitive",
    topic: "Shape Rotation",
    difficulty: "medium",
    question: "The arrow in each frame undergoes a fixed rotational transformation. Determine the orientation of the arrow in the next frame.",
    options: [
      { id: "A", text: "Arrow pointing South (180°)" },
      { id: "B", text: "Arrow pointing West (270°)" },
      { id: "C", text: "Arrow pointing South-West (225°)" },
      { id: "D", text: "Arrow pointing North-East (45°)" }
    ],
    correct_option_id: "A",
    correct_answer: "Arrow pointing South (180°)",
    explanation: "Rule: The arrow rotates clockwise by 45° in each step: 0° (North) -> 45° (North-East) -> 90° (East) -> 135° (South-East). The next rotation by 45° yields 180°, which points directly South.",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "shape_rotation", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "An arrow rotating clockwise by 45 degrees across 4 consecutive frames",
      rule_explanation: "Clockwise rotation theta = theta + 45 deg",
      prompt_frames: [
        { label: "0°", shapes: [{ kind: "arrow", x1: 50, y1: 75, x2: 50, y2: 25, rotation: 0 }] },
        { label: "45°", shapes: [{ kind: "arrow", x1: 50, y1: 75, x2: 50, y2: 25, rotation: 45 }] },
        { label: "90°", shapes: [{ kind: "arrow", x1: 50, y1: 75, x2: 50, y2: 25, rotation: 90 }] },
        { label: "135°", shapes: [{ kind: "arrow", x1: 50, y1: 75, x2: 50, y2: 25, rotation: 135 }] }
      ]
    }
  },
  {
    id: "vis_poly_03",
    track: "cognitive",
    topic: "Figure Sequences",
    difficulty: "easy",
    question: "Identify the geometric pattern governing the polygon vertices. Which shape correctly continues the sequence?",
    options: [
      { id: "A", text: "Hexagon (6 sides)" },
      { id: "B", text: "Heptagon (7 sides)" },
      { id: "C", text: "Square with an inscribed circle" },
      { id: "D", text: "Octagon (8 sides)" }
    ],
    correct_option_id: "A",
    correct_answer: "Hexagon (6 sides)",
    explanation: "Rule: The number of vertices and sides increments by 1 for each figure: Triangle (3) -> Quadrilateral (4) -> Regular Pentagon (5). The next figure in the series is a regular Hexagon (6 sides).",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "polygon_vertex_progression", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "Polygons progressing from 3-sided triangle to 4-sided square to 5-sided pentagon",
      rule_explanation: "Polygon vertex count increments by +1",
      prompt_frames: [
        { label: "n=3", shapes: [{ kind: "polygon", points: "50,20 80,80 20,80" }] },
        { label: "n=4", shapes: [{ kind: "rect", x: 25, y: 25, width: 50, height: 50 }] },
        { label: "n=5", shapes: [{ kind: "polygon", points: "50,18 85,42 72,82 28,82 15,42" }] }
      ]
    }
  },
  {
    id: "vis_mir_04",
    track: "cognitive",
    topic: "Mirror Images",
    difficulty: "medium",
    question: "Which option represents the correct reflection of the given asymmetrical figure across the vertical mirror plane M-N?",
    options: [
      { id: "A", text: "Figure with flag pennant extending to the right and cross at bottom left" },
      { id: "B", text: "Figure with flag pennant extending to the left and cross at bottom right" },
      { id: "C", text: "Figure inverted vertically with pennant on the right" },
      { id: "D", text: "Unchanged original figure" }
    ],
    correct_option_id: "B",
    correct_answer: "Figure with flag pennant extending to the left and cross at bottom right",
    explanation: "Rule: In a vertical plane reflection (lateral inversion), left and right coordinates swap (x' = 100 - x) while vertical heights remain identical. The right-pointing flag projects leftwards, and the bottom-left marker reflects to bottom-right.",
    recommended_time_seconds: 50,
    provenance: { category: "visual_aptitude", type: "mirror_reflection", version: "2.0" },
    diagram_spec: {
      type: "mirror_water",
      axis_type: "vertical_mirror",
      aria_label: "Asymmetric flag structure facing a vertical mirror line M-N",
      rule_explanation: "Lateral inversion across x-axis center",
      left_figure: {
        label: "Object",
        shapes: [
          { kind: "line", x1: 35, y1: 20, x2: 35, y2: 80, strokeWidth: 3 },
          { kind: "polygon", points: "35,20 75,35 35,50", fill: "var(--cyan)", strokeWidth: 2 },
          { kind: "cross", x: 20, y: 75, stroke: "var(--coral)" }
        ]
      }
    }
  },
  {
    id: "vis_wat_05",
    track: "cognitive",
    topic: "Water Images",
    difficulty: "medium",
    question: "Identify the correct reflection of the diagram across the horizontal water surface plane W-W'.",
    options: [
      { id: "A", text: "Upward pointing triangle with circle on top" },
      { id: "B", text: "Downward pointing triangle with circle on top" },
      { id: "C", text: "Downward pointing triangle with circle at the bottom" },
      { id: "D", text: "Horizontal triangle pointing East" }
    ],
    correct_option_id: "C",
    correct_answer: "Downward pointing triangle with circle at the bottom",
    explanation: "Rule: In a horizontal water reflection, top and bottom coordinates invert (y' = 100 - y) while lateral left-to-right positions remain unchanged. An upward-pointing triangle reflects into a downward-pointing triangle, and the top circle reflects to the bottom.",
    recommended_time_seconds: 50,
    provenance: { category: "visual_aptitude", type: "water_image", version: "2.0" },
    diagram_spec: {
      type: "mirror_water",
      axis_type: "horizontal_water",
      aria_label: "Upward pointing geometric assembly positioned above water surface",
      rule_explanation: "Vertical inversion across y-axis center: y' = 100 - y",
      left_figure: {
        label: "Object",
        shapes: [
          { kind: "polygon", points: "50,30 80,80 20,80", strokeWidth: 2 },
          { kind: "circle", x: 50, y: 20, r: 8, fill: "var(--blue)" }
        ]
      }
    }
  },
  {
    id: "vis_ana_06",
    track: "cognitive",
    topic: "Figure Analogy",
    difficulty: "medium",
    question: "Figure A is related to Figure B by an inversion rule. Apply the exact same transformation to Figure C to find the missing Figure D.",
    options: [
      { id: "A", text: "A small circle inscribed inside a large triangle" },
      { id: "B", text: "A small square inscribed inside a large triangle" },
      { id: "C", text: "A small triangle inscribed inside a large circle" },
      { id: "D", text: "Two concentric squares" }
    ],
    correct_option_id: "C",
    correct_answer: "A small triangle inscribed inside a large circle",
    explanation: "Rule: In the pair A : B, the outer and inner shapes swap roles (Outer square with inner circle -> Outer circle with inner square). Applying this to Figure C (Outer triangle with inner circle), the result must be an outer circle with an inner triangle.",
    recommended_time_seconds: 55,
    provenance: { category: "visual_aptitude", type: "figure_analogy", version: "2.0" },
    diagram_spec: {
      type: "analogy",
      aria_label: "Analogy pair A:B :: C:? showing nesting inversion",
      rule_explanation: "Role swap: Outer(X), Inner(Y) -> Outer(Y), Inner(X)",
      prompt_frames: [
        { label: "A", shapes: [{ kind: "rect", x: 20, y: 20, width: 60, height: 60 }, { kind: "circle", x: 50, y: 50, r: 18, fill: "var(--cyan)" }] },
        { label: "B", shapes: [{ kind: "circle", x: 50, y: 50, r: 35 }, { kind: "rect", x: 35, y: 35, width: 30, height: 30, fill: "var(--blue)" }] },
        { label: "C", shapes: [{ kind: "polygon", points: "50,15 85,80 15,80" }, { kind: "circle", x: 50, y: 55, r: 14, fill: "var(--cyan)" }] }
      ]
    }
  },
  {
    id: "vis_mat_07",
    track: "cognitive",
    topic: "Matrix Reasoning",
    difficulty: "hard",
    question: "Complete the 3x3 visual matrix puzzle by deducing the row-wise and column-wise distribution of geometric shapes.",
    options: [
      { id: "A", text: "A shaded square" },
      { id: "B", text: "A hollow circle" },
      { id: "C", text: "A shaded triangle" },
      { id: "D", text: "A cross inside a square" }
    ],
    correct_option_id: "A",
    correct_answer: "A shaded square",
    explanation: "Rule: Each row and column in the 3x3 matrix must contain exactly one circle, one triangle, and one square. Row 3 contains a circle and a triangle. The missing shape is the square, with consistent shaded fill according to the diagonal fill rule.",
    recommended_time_seconds: 60,
    provenance: { category: "visual_aptitude", type: "matrix_completion_3x3", version: "2.0" },
    diagram_spec: {
      type: "matrix",
      grid_size: 3,
      aria_label: "A 3x3 matrix containing circles, squares, and triangles with the bottom-right cell missing",
      rule_explanation: "Latin square permutation of shapes across rows and columns",
      matrix_cells: [
        { shapes: [{ kind: "circle", x: 50, y: 50, r: 24, fill: "var(--blue)" }] },
        { shapes: [{ kind: "rect", x: 25, y: 25, width: 50, height: 50 }] },
        { shapes: [{ kind: "polygon", points: "50,20 80,80 20,80" }] },
        { shapes: [{ kind: "rect", x: 25, y: 25, width: 50, height: 50 }] },
        { shapes: [{ kind: "polygon", points: "50,20 80,80 20,80", fill: "var(--blue)" }] },
        { shapes: [{ kind: "circle", x: 50, y: 50, r: 24 }] },
        { shapes: [{ kind: "polygon", points: "50,20 80,80 20,80" }] },
        { shapes: [{ kind: "circle", x: 50, y: 50, r: 24, fill: "var(--blue)" }] },
        null
      ]
    }
  },
  {
    id: "vis_odd_08",
    track: "cognitive",
    topic: "Odd Figure Out",
    difficulty: "medium",
    question: "Four figures are presented below. Three share a specific structural symmetry rule, while one violates it. Which is the odd figure out?",
    options: [
      { id: "A", text: "Figure 1 (Symmetric rectangle with two internal diagonals)" },
      { id: "B", text: "Figure 2 (Equilateral triangle with median lines)" },
      { id: "C", text: "Figure 3 (Regular hexagon with center diagonals)" },
      { id: "D", text: "Figure 4 (Scalene triangle with asymmetrical internal lines)" }
    ],
    correct_option_id: "D",
    correct_answer: "Figure 4 (Scalene triangle with asymmetrical internal lines)",
    explanation: "Rule: Figures 1, 2, and 3 possess bilateral reflective symmetry along their vertical axis with equal partitions. Figure 4 is an asymmetrical scalene polygon with non-congruent sub-regions, making it the odd figure out.",
    recommended_time_seconds: 50,
    provenance: { category: "visual_aptitude", type: "odd_one_out", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "Four geometric shapes: three symmetrical and one asymmetrical",
      rule_explanation: "Bilateral axis symmetry classification",
      prompt_frames: [
        { label: "1", shapes: [{ kind: "rect", x: 20, y: 20, width: 60, height: 60 }, { kind: "line", x1: 20, y1: 20, x2: 80, y2: 80 }, { kind: "line", x1: 80, y1: 20, x2: 20, y2: 80 }] },
        { label: "2", shapes: [{ kind: "polygon", points: "50,15 85,80 15,80" }, { kind: "line", x1: 50, y1: 15, x2: 50, y2: 80 }] },
        { label: "3", shapes: [{ kind: "polygon", points: "50,15 85,35 85,75 50,90 15,75 15,35" }, { kind: "line", x1: 50, y1: 15, x2: 50, y2: 90 }] },
        { label: "4", shapes: [{ kind: "polygon", points: "20,20 90,40 40,85" }, { kind: "line", x1: 30, y1: 35, x2: 70, y2: 75 }] }
      ]
    }
  },
  {
    id: "vis_fold_09",
    track: "cognitive",
    topic: "Paper Folding & Punching",
    difficulty: "hard",
    question: "A square sheet is folded along the dashed lines in Step 1 and Step 2, and a circular hole is punched in Step 3. What pattern appears when the paper is completely unfolded?",
    options: [
      { id: "A", text: "2 holes along the horizontal center line" },
      { id: "B", text: "4 holes symmetrically spaced around the center of the sheet" },
      { id: "C", text: "1 single hole in the center" },
      { id: "D", text: "8 holes arranged in a circle" }
    ],
    correct_option_id: "B",
    correct_answer: "4 holes symmetrically spaced around the center of the sheet",
    explanation: "Rule: The paper is folded once horizontally (doubling the layers to 2) and once vertically (doubling to 4 layers). Punching 1 hole through the 4-layer quadrant creates exactly 4 holes symmetrically positioned across all 4 quadrants upon unfolding.",
    recommended_time_seconds: 60,
    provenance: { category: "visual_aptitude", type: "paper_folding", version: "2.0" },
    diagram_spec: {
      type: "paper_folding",
      aria_label: "Step-by-step paper folding and hole punch diagram",
      rule_explanation: "Two orthogonal folds create 4 quadrants; 1 punch = 4 unfolded holes",
      fold_steps: [
        { label: "Step 1", shapes: [{ kind: "rect", x: 15, y: 15, width: 70, height: 70 }, { kind: "fold_line", x1: 50, y1: 15, x2: 50, y2: 85 }] },
        { label: "Step 2", shapes: [{ kind: "rect", x: 50, y: 15, width: 35, height: 70 }, { kind: "fold_line", x1: 50, y1: 50, x2: 85, y2: 50 }] },
        { label: "Step 3: Punch", shapes: [{ kind: "rect", x: 50, y: 50, width: 35, height: 35 }, { kind: "dot", x: 67, y: 67, r: 6 }] }
      ]
    }
  },
  {
    id: "vis_cut_10",
    track: "cognitive",
    topic: "Paper Cutting",
    difficulty: "hard",
    question: "A circular paper disk is folded into a semi-circle, then folded into a quadrant, and a triangular notch is cut from the curved rim. What is the unfolded design?",
    options: [
      { id: "A", text: "A circle with 4 diamond-shaped cutouts along the outer rim" },
      { id: "B", text: "A circle with 2 cutouts at opposite ends" },
      { id: "C", text: "A square cutout in the center" },
      { id: "D", text: "A circle with 8 triangular notches" }
    ],
    correct_option_id: "A",
    correct_answer: "A circle with 4 diamond-shaped cutouts along the outer rim",
    explanation: "Rule: Quadrant folding produces 4 radial sectors. Cutting a triangular wedge from the folded outer rim reflects into 4 symmetric diamond-shaped notches located at 0°, 90°, 180°, and 270° along the boundary when unfolded.",
    recommended_time_seconds: 60,
    provenance: { category: "visual_aptitude", type: "paper_cutting", version: "2.0" },
    diagram_spec: {
      type: "paper_folding",
      aria_label: "Circular paper disk folded into quarters with a rim notch cut",
      rule_explanation: "Quarter fold symmetry yields 4 perimeter cutouts",
      fold_steps: [
        { label: "Full Disk", shapes: [{ kind: "circle", x: 50, y: 50, r: 35 }] },
        { label: "Semi-Circle", shapes: [{ kind: "polygon", points: "15,50 85,50 75,20 25,20" }] },
        { label: "Quadrant Notch", shapes: [{ kind: "polygon", points: "50,50 85,50 75,20 50,20" }, { kind: "polygon", points: "75,35 65,35 70,25", fill: "var(--coral)" }] }
      ]
    }
  },
  {
    id: "vis_dice_11",
    track: "cognitive",
    topic: "Cube and Dice Reasoning",
    difficulty: "medium",
    question: "On a standard die where opposite faces sum to 7, Face 4 is on the top and Face 2 is in front. What number appears on the face directly opposite to Face 2?",
    options: [
      { id: "A", text: "5" },
      { id: "B", text: "3" },
      { id: "C", text: "1" },
      { id: "D", text: "6" }
    ],
    correct_option_id: "A",
    correct_answer: "5",
    explanation: "Rule: On all standard dice, opposite faces consistently sum to 7: (1 opposite 6), (2 opposite 5), and (3 opposite 4). Therefore, the face directly opposite to Face 2 (the back face) is 7 - 2 = 5.",
    recommended_time_seconds: 40,
    provenance: { category: "visual_aptitude", type: "dice_faces", version: "2.0" },
    diagram_spec: {
      type: "dice",
      aria_label: "Isometric view of a die showing top face 4 and front face 2",
      rule_explanation: "Standard opposite face sum rule: Opposite = 7 - Face",
      prompt_frames: [
        { label: "Front Face: 2", shapes: [{ kind: "dice_face", dots: [1, 9] }] },
        { label: "Top Face: 4", shapes: [{ kind: "dice_face", dots: [1, 3, 7, 9] }] }
      ]
    }
  },
  {
    id: "vis_dice_12",
    track: "cognitive",
    topic: "Dice Net Folding",
    difficulty: "hard",
    question: "When the unfolded 6-face cross net shown in the diagram is folded into a cube, which face lies directly opposite to Face 3?",
    options: [
      { id: "A", text: "Face 5" },
      { id: "B", text: "Face 6" },
      { id: "C", text: "Face 1" },
      { id: "D", text: "Face 4" }
    ],
    correct_option_id: "A",
    correct_answer: "Face 5",
    explanation: "Rule: In a linear strip of faces on an unfolded cube net, alternating faces (separated by one intervening face) become opposite faces when folded. In the column 1 -> 3 -> 5, Face 3 is directly opposite to Face 5.",
    recommended_time_seconds: 55,
    provenance: { category: "visual_aptitude", type: "cube_net_folding", version: "2.0" },
    diagram_spec: {
      type: "single_figure",
      aria_label: "Unfolded cross net of a cube with numbered faces 1 to 6",
      rule_explanation: "Alternating strip elements become opposite faces in 3D: Face[k] opp Face[k+2]",
      prompt_frames: [
        {
          label: "Cube Net",
          shapes: [
            { kind: "rect", x: 40, y: 10, width: 20, height: 20 }, { kind: "text", x: 50, y: 20, text: "1" },
            { kind: "rect", x: 20, y: 30, width: 20, height: 20 }, { kind: "text", x: 30, y: 40, text: "2" },
            { kind: "rect", x: 40, y: 30, width: 20, height: 20 }, { kind: "text", x: 50, y: 40, text: "3" },
            { kind: "rect", x: 60, y: 30, width: 20, height: 20 }, { kind: "text", x: 70, y: 40, text: "4" },
            { kind: "rect", x: 40, y: 50, width: 20, height: 20 }, { kind: "text", x: 50, y: 60, text: "5" },
            { kind: "rect", x: 40, y: 70, width: 20, height: 20 }, { kind: "text", x: 50, y: 80, text: "6" }
          ]
        }
      ]
    }
  },
  {
    id: "vis_cnt_13",
    track: "cognitive",
    topic: "Count The Shapes",
    difficulty: "medium",
    question: "How many total triangles are formed inside the square by the intersection of both main diagonals and horizontal mid-line?",
    options: [
      { id: "A", text: "8" },
      { id: "B", text: "12" },
      { id: "C", text: "10" },
      { id: "D", text: "6" }
    ],
    correct_option_id: "B",
    correct_answer: "12",
    explanation: "Rule: 1) Four small triangles in top/bottom halves (6 unit triangles). 2) Four medium triangles formed by diagonal halves (4). 3) Two large triangles formed by the horizontal divide with diagonal edges (2). Total = 6 + 4 + 2 = 12 triangles.",
    recommended_time_seconds: 55,
    provenance: { category: "visual_aptitude", type: "count_the_shapes", version: "2.0" },
    diagram_spec: {
      type: "single_figure",
      aria_label: "A square divided by two diagonals and a horizontal center line",
      rule_explanation: "Combinatorial shape counting: sum of unit, medium, and composite triangles = 12",
      prompt_frames: [
        {
          label: "Shape Count",
          shapes: [
            { kind: "rect", x: 15, y: 15, width: 70, height: 70, strokeWidth: 2 },
            { kind: "line", x1: 15, y1: 15, x2: 85, y2: 85, strokeWidth: 2 },
            { kind: "line", x1: 85, y1: 15, x2: 15, y2: 85, strokeWidth: 2 },
            { kind: "line", x1: 15, y1: 50, x2: 85, y2: 50, strokeWidth: 2, stroke: "var(--cyan)" }
          ]
        }
      ]
    }
  },
  {
    id: "vis_emb_14",
    track: "cognitive",
    topic: "Embedded Shapes",
    difficulty: "medium",
    question: "Which of the following complex line networks contains the simple letter 'Z' shape embedded without alteration of angles?",
    options: [
      { id: "A", text: "Figure 1 (Diamond grid with horizontal top/bottom spans)" },
      { id: "B", text: "Figure 2 (Concentric circular rings)" },
      { id: "C", text: "Figure 3 (Vertical parallel lines only)" },
      { id: "D", text: "Figure 4 (Cross-hatched squares with vertical diagonal)" }
    ],
    correct_option_id: "A",
    correct_answer: "Figure 1 (Diamond grid with horizontal top/bottom spans)",
    explanation: "Rule: The target 'Z' consists of top horizontal line (left-to-right), diagonal line (top-right to bottom-left), and bottom horizontal line (left-to-right). Figure 1 directly contains these contiguous connected segments.",
    recommended_time_seconds: 50,
    provenance: { category: "visual_aptitude", type: "embedded_figures", version: "2.0" },
    diagram_spec: {
      type: "single_figure",
      aria_label: "A geometric grid containing an embedded Z shape",
      rule_explanation: "Sub-graph isomorphism identifying target shape 'Z'",
      prompt_frames: [
        {
          label: "Target Z",
          shapes: [
            { kind: "line", x1: 25, y1: 25, x2: 75, y2: 25, strokeWidth: 3, stroke: "var(--blue)" },
            { kind: "line", x1: 75, y1: 25, x2: 25, y2: 75, strokeWidth: 3, stroke: "var(--blue)" },
            { kind: "line", x1: 25, y1: 75, x2: 75, y2: 75, strokeWidth: 3, stroke: "var(--blue)" }
          ]
        }
      ]
    }
  },
  {
    id: "vis_cla_15",
    track: "cognitive",
    topic: "Figure Classification",
    difficulty: "easy",
    question: "Classify the given figures into two distinct groups based on whether their perimeter is composed strictly of straight line segments or curved curves.",
    options: [
      { id: "A", text: "Group 1: (1, 3, 5); Group 2: (2, 4)" },
      { id: "B", text: "Group 1: (1, 2); Group 2: (3, 4, 5)" },
      { id: "C", text: "Group 1: (1, 4); Group 2: (2, 3, 5)" },
      { id: "D", text: "All belong to the same group" }
    ],
    correct_option_id: "A",
    correct_answer: "Group 1: (1, 3, 5); Group 2: (2, 4)",
    explanation: "Rule: Shapes 1 (Square), 3 (Triangle), and 5 (Hexagon) are strictly rectilinear polygons formed by straight line segments. Shapes 2 (Circle) and 4 (Oval) are curvilinear.",
    recommended_time_seconds: 40,
    provenance: { category: "visual_aptitude", type: "figure_classification", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "A set of five figures containing polygons and curvilinear shapes",
      rule_explanation: "Topological partition: Rectilinear polygons vs Curvilinear ellipses",
      prompt_frames: [
        { label: "1", shapes: [{ kind: "rect", x: 25, y: 25, width: 50, height: 50 }] },
        { label: "2", shapes: [{ kind: "circle", x: 50, y: 50, r: 25 }] },
        { label: "3", shapes: [{ kind: "polygon", points: "50,20 80,80 20,80" }] },
        { label: "4", shapes: [{ kind: "circle", x: 50, y: 50, r: 20 }] },
        { label: "5", shapes: [{ kind: "polygon", points: "50,15 85,35 85,75 50,95 15,75 15,35" }] }
      ]
    }
  },
  {
    id: "vis_spa_16",
    track: "cognitive",
    topic: "Spatial Orientation",
    difficulty: "medium",
    question: "If an L-shaped polyomino block is rotated 90 degrees counter-clockwise and then flipped horizontally, what is its resulting orientation?",
    options: [
      { id: "A", text: "Horizontal base with vertical arm rising upward on the right" },
      { id: "B", text: "Horizontal base with vertical arm rising upward on the left" },
      { id: "C", text: "Vertical column with arm extending to the right" },
      { id: "D", text: "Inverted T-shape" }
    ],
    correct_option_id: "A",
    correct_answer: "Horizontal base with vertical arm rising upward on the right",
    explanation: "Rule: Initial: Vertical tall arm at x=30, horizontal foot at y=70 extending right to x=70. 1) Rotate 90° CCW: the vertical arm points left, foot points up. 2) Flip horizontally: Left arm reflects to right side, base rests horizontally with arm rising on the right.",
    recommended_time_seconds: 50,
    provenance: { category: "visual_aptitude", type: "spatial_orientation", version: "2.0" },
    diagram_spec: {
      type: "single_figure",
      aria_label: "An L-shaped figure undergoing combined CCW rotation and horizontal flip",
      rule_explanation: "Transformation composition: T = Flip_H * Rot_CCW(90 deg)",
      prompt_frames: [
        {
          label: "Initial L",
          shapes: [
            { kind: "line", x1: 30, y1: 20, x2: 30, y2: 75, strokeWidth: 4, stroke: "var(--blue)" },
            { kind: "line", x1: 30, y1: 75, x2: 70, y2: 75, strokeWidth: 4, stroke: "var(--blue)" }
          ]
        }
      ]
    }
  },
  {
    id: "vis_pat_17",
    track: "cognitive",
    topic: "Pattern Transformation",
    difficulty: "medium",
    question: "In the transformation rule: Solid shapes become hollow, and hollow shapes gain a center dot. What is the output when this rule is applied to a hollow square with a solid inner circle?",
    options: [
      { id: "A", text: "A square with a center dot containing a hollow inner circle" },
      { id: "B", text: "A solid square with a solid circle" },
      { id: "C", text: "Two concentric hollow circles" },
      { id: "D", text: "A square with no inner shapes" }
    ],
    correct_option_id: "A",
    correct_answer: "A square with a center dot containing a hollow inner circle",
    explanation: "Rule: Hollow -> Hollow with dot; Solid -> Hollow. The outer hollow square becomes a square with a dot, and the solid inner circle becomes a hollow circle.",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "pattern_transformation", version: "2.0" },
    diagram_spec: {
      type: "analogy",
      aria_label: "Analogy showcasing solid-to-hollow and hollow-to-dot transformation rules",
      rule_explanation: "State map: Solid -> Hollow, Hollow -> Dot",
      prompt_frames: [
        { label: "Rule In", shapes: [{ kind: "circle", x: 50, y: 50, r: 25, fill: "var(--blue)" }] },
        { label: "Rule Out", shapes: [{ kind: "circle", x: 50, y: 50, r: 25, fill: "none" }] },
        { label: "Input", shapes: [{ kind: "rect", x: 25, y: 25, width: 50, height: 50 }, { kind: "circle", x: 50, y: 50, r: 14, fill: "var(--blue)" }] }
      ]
    }
  },
  {
    id: "vis_arr_18",
    track: "cognitive",
    topic: "Visual Arrangement",
    difficulty: "medium",
    question: "Concentric shapes alternate between square and diamond in nesting layers. If Layer 1 (outermost) is a Square, Layer 2 is a Diamond, and Layer 3 is a Square, what must Layer 4 be?",
    options: [
      { id: "A", text: "A Diamond inscribed inside the Layer 3 Square" },
      { id: "B", text: "A Circle" },
      { id: "C", text: "Another Square identical to Layer 3" },
      { id: "D", text: "An Octagon" }
    ],
    correct_option_id: "A",
    correct_answer: "A Diamond inscribed inside the Layer 3 Square",
    explanation: "Rule: Strictly alternating nesting series: Square (0° rotation) -> Diamond (45° rotated square) -> Square -> Diamond. Layer 4 must be a 45° diamond nested within Layer 3.",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "visual_arrangement", version: "2.0" },
    diagram_spec: {
      type: "single_figure",
      aria_label: "Concentric alternating squares and diamonds nesting inward",
      rule_explanation: "Alternating rotation theta = 0 deg <-> theta = 45 deg across concentric shells",
      prompt_frames: [
        {
          label: "Nesting 1-3",
          shapes: [
            { kind: "rect", x: 15, y: 15, width: 70, height: 70 },
            { kind: "polygon", points: "50,20 80,50 50,80 20,50", stroke: "var(--cyan)" },
            { kind: "rect", x: 35, y: 35, width: 30, height: 30 }
          ]
        }
      ]
    }
  },
  {
    id: "vis_sym_19",
    track: "cognitive",
    topic: "Mixed Symbol-Shape Patterns",
    difficulty: "medium",
    question: "A frame contains a quadrant circle with a rotating internal cross symbol. The cross moves clockwise from quadrant I to II to III. Where must it appear in the 4th frame?",
    options: [
      { id: "A", text: "In Quadrant IV (bottom-right)" },
      { id: "B", text: "In Quadrant I (top-right)" },
      { id: "C", text: "In the exact center of the circle" },
      { id: "D", text: "Outside the circular perimeter" }
    ],
    correct_option_id: "A",
    correct_answer: "In Quadrant IV (bottom-right)",
    explanation: "Rule: The cross rotates clockwise around the 4 quadrant sectors: Top-right (I) -> Bottom-right? Clockwise order is Top-right (I) -> Bottom-right (IV) -> Bottom-left (III) -> Top-left (II). The sequence advances 90° clockwise each step.",
    recommended_time_seconds: 45,
    provenance: { category: "visual_aptitude", type: "mixed_symbol_patterns", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "A cross traversing the quadrants of a circle in clockwise steps",
      rule_explanation: "Orbital quadrant transition: Q(k+1) = (Q(k) + 1) mod 4",
      prompt_frames: [
        { label: "1", shapes: [{ kind: "circle", x: 50, y: 50, r: 35 }, { kind: "cross", x: 65, y: 35 }] },
        { label: "2", shapes: [{ kind: "circle", x: 50, y: 50, r: 35 }, { kind: "cross", x: 65, y: 65 }] },
        { label: "3", shapes: [{ kind: "circle", x: 50, y: 50, r: 35 }, { kind: "cross", x: 35, y: 65 }] }
      ]
    }
  },
  {
    id: "vis_mul_20",
    track: "cognitive",
    topic: "Two-Step Multi-Rule Sequences",
    difficulty: "hard",
    question: "Two simultaneous rules govern the frame: Rule 1: The outer equilateral triangle flips vertically every step. Rule 2: The internal black dot advances by +1 along the triangle's vertices counter-clockwise. Deducing both rules, which frame correctly follows Frame 3?",
    options: [
      { id: "A", text: "Inverted triangle (pointing down) with black dot at bottom vertex" },
      { id: "B", text: "Upward triangle (pointing up) with black dot at top vertex" },
      { id: "C", text: "Inverted triangle (pointing down) with black dot at top-right vertex" },
      { id: "D", text: "Upward triangle with black dot at bottom-left vertex" }
    ],
    correct_option_id: "A",
    correct_answer: "Inverted triangle (pointing down) with black dot at bottom vertex",
    explanation: "Rule 1 (Orientation): Alternates Up -> Down -> Up -> Down. Thus Frame 4 must point Down. Rule 2 (Dot Position): Vertex advances CCW. In Frame 3 (Up) the dot was at top-right. Advancing to the next vertex on an inverted triangle positions the dot at the bottom apex.",
    recommended_time_seconds: 60,
    provenance: { category: "visual_aptitude", type: "two_step_multi_rule", version: "2.0" },
    diagram_spec: {
      type: "sequence",
      aria_label: "Two-step visual rule: Alternating vertical flip combined with CCW vertex dot progression",
      rule_explanation: "Simultaneous periodic orientation flip and cyclic vertex translation",
      prompt_frames: [
        { label: "1 (Up)", shapes: [{ kind: "polygon", points: "50,20 80,75 20,75" }, { kind: "dot", x: 50, y: 25, r: 5 }] },
        { label: "2 (Down)", shapes: [{ kind: "polygon", points: "20,25 80,25 50,80" }, { kind: "dot", x: 25, y: 28, r: 5 }] },
        { label: "3 (Up)", shapes: [{ kind: "polygon", points: "50,20 80,75 20,75" }, { kind: "dot", x: 75, y: 70, r: 5 }] }
      ]
    }
  }
];

// 3. Categorize existing questions by domain
const quantitativeQuestions = existingQuestions.filter(q =>
  ['Percentages', 'Ratios', 'Speed Distance Time', 'Time and Work', 'Probability', 'Simple Interest', 'Compound Interest', 'Profit and Loss', 'Averages', 'Mixtures', 'Discounts', 'Rate Problems'].includes(q.topic)
);

const logicalQuestions = existingQuestions.filter(q =>
  ['Number Series', 'Logical Deduction', 'Direction Sense', 'Coding Decoding', 'Analogies', 'Letter Series', 'Ordering', 'Clock Angles', 'Odd One Out', 'Combinations', 'Inference'].includes(q.topic)
);

const verbalQuestions = existingQuestions.filter(q =>
  ['Grammar', 'Verbal Ability', 'Sentence Correction', 'Reading Comprehension', 'Vocabulary'].includes(q.topic) ||
  q.track === 'verbal'
);

// If verbal has few items, add high-quality verified verbal reasoning questions
const standardVerbalQuestions = [
  {
    id: "verb_01",
    track: "cognitive",
    topic: "Sentence Correction",
    difficulty: "easy",
    question: "Identify the grammatically correct sentence among the given options:",
    options: [
      { id: "A", text: "Neither the plant operator nor the field technicians was present during calibration." },
      { id: "B", text: "Neither the plant operator nor the field technicians were present during calibration." },
      { id: "C", text: "Neither the plant operator nor the field technicians are present yesterday." },
      { id: "D", text: "Neither the plant operator or the field technicians were present during calibration." }
    ],
    correct_option_id: "B",
    correct_answer: "Neither the plant operator nor the field technicians were present during calibration.",
    explanation: "Rule of Proximity for correlative conjunctions 'neither... nor': When two subjects are connected by 'neither... nor', the verb must agree in number with the closer subject. 'Technicians' is plural, requiring the plural past-tense verb 'were'.",
    recommended_time_seconds: 45,
    provenance: { category: "verbal_ability", standard: "Subject-Verb Agreement" }
  },
  {
    id: "verb_02",
    track: "cognitive",
    topic: "Vocabulary & Analogies",
    difficulty: "medium",
    question: "Select the pair that best expresses a relationship similar to that expressed in the pair: TRANSIENT : PERMANENCE",
    options: [
      { id: "A", text: "EPHEMERAL : LONGEVITY" },
      { id: "B", text: "VOLATILE : EVAPORATION" },
      { id: "C", text: "RIGID : FLEXIBILITY" },
      { id: "D", text: "TENACIOUS : ENDURANCE" }
    ],
    correct_option_id: "A",
    correct_answer: "EPHEMERAL : LONGEVITY",
    explanation: "'Transient' describes something lacking 'permanence' (antonymic quality). Similarly, 'ephemeral' (short-lived) inherently lacks 'longevity' (long life). Both pairs demonstrate an adjective defining the absence of the corresponding noun quality.",
    recommended_time_seconds: 45,
    provenance: { category: "verbal_ability", standard: "Semantic Antonyms" }
  },
  {
    id: "verb_03",
    track: "cognitive",
    topic: "Reading Comprehension",
    difficulty: "medium",
    question: "Read the premise: 'Closed-loop feedback systems dynamically adjust actuator outputs based on measured process deviation from setpoint. While they attenuate external disturbances, improper gain scheduling can induce self-sustaining oscillations.' What is the primary operational risk identified?",
    options: [
      { id: "A", text: "Complete actuator power failure" },
      { id: "B", text: "Instability through self-sustaining oscillations caused by poorly tuned controller gain" },
      { id: "C", text: "Inability to respond to process setpoint modifications" },
      { id: "D", text: "Excessive attenuation of desired signals" }
    ],
    correct_option_id: "B",
    correct_answer: "Instability through self-sustaining oscillations caused by poorly tuned controller gain",
    explanation: "The passage directly links the risk to 'improper gain scheduling' which 'can induce self-sustaining oscillations', representing closed-loop instability.",
    recommended_time_seconds: 50,
    provenance: { category: "verbal_ability", standard: "Technical Comprehension" }
  }
];

const dataInterpretationQuestions = existingQuestions.filter(q =>
  ['Data Interpretation', 'Charts and Graphs', 'Tables'].includes(q.topic)
);

// Standard DI questions
const standardDIQuestions = [
  {
    id: "di_01",
    track: "cognitive",
    topic: "Data Interpretation",
    difficulty: "medium",
    question: "A process refinery unit records feedstock throughput over 4 consecutive quarters: Q1 = 120,000 bpd, Q2 = 150,000 bpd, Q3 = 135,000 bpd, Q4 = 180,000 bpd. What is the percentage increase in throughput from Q1 to Q4?",
    options: [
      { id: "A", text: "33.3%" },
      { id: "B", text: "50.0%" },
      { id: "C", text: "60.0%" },
      { id: "D", text: "45.0%" }
    ],
    correct_option_id: "B",
    correct_answer: "50.0%",
    explanation: "Percentage increase = ((Q4 - Q1) / Q1) * 100 = ((180,000 - 120,000) / 120,000) * 100 = (60,000 / 120,000) * 100 = 50.0%.",
    recommended_time_seconds: 60,
    provenance: { category: "data_interpretation", standard: "Percentage Change Analysis" }
  },
  {
    id: "di_02",
    track: "cognitive",
    topic: "Data Interpretation",
    difficulty: "medium",
    question: "In an industrial plant, sensor alarm distributions across three shifts are: Morning (45 alarms), Afternoon (35 alarms), Night (70 alarms). What fraction of total daily alarms occurred during the Night shift?",
    options: [
      { id: "A", text: "7/15 (approx 46.7%)" },
      { id: "B", text: "1/2 (50.0%)" },
      { id: "C", text: "3/8 (37.5%)" },
      { id: "D", text: "2/5 (40.0%)" }
    ],
    correct_option_id: "A",
    correct_answer: "7/15 (approx 46.7%)",
    explanation: "Total alarms = 45 + 35 + 70 = 150. Night shift share = 70 / 150 = 7/15 = 46.67%.",
    recommended_time_seconds: 50,
    provenance: { category: "data_interpretation", standard: "Ratio & Distribution Analysis" }
  }
];

const technicalQuestions = existingQuestions.filter(q => q.track === 'instrumentation');

// Company track questions
const companyTrackQuestions = [
  {
    id: "comp_ril_01",
    track: "company_track",
    company_id: "ril_get_2027",
    topic: "RIL Assessment Structure",
    difficulty: "medium",
    question: "In an industrial petrochemical steam cracker, what type of temperature sensor is standardly specified for radiant coil tube-skin monitoring up to 1100°C?",
    options: [
      { id: "A", text: "Type K or Type N specialized sheath Thermocouple" },
      { id: "B", text: "Class A Pt100 RTD" },
      { id: "C", text: "Standard bimetallic dial gauge" },
      { id: "D", text: "NTC 10k thermistor" }
    ],
    correct_option_id: "A",
    correct_answer: "Type K or Type N specialized sheath Thermocouple",
    explanation: "Petrochemical furnace tubes operate between 900°C and 1150°C. RTDs degrade above 600°C-850°C. Heavy-wall Inconel-sheathed Type K (Chromel-Alumel) or Type N (Nicrosil-Nisil) thermocouples with knife-edge weld pads are the industrial standard.",
    recommended_time_seconds: 60,
    provenance: { company: "RIL GET 2027", role: "E&I Trainee", type: "industrial_standard" }
  },
  {
    id: "comp_lnt_01",
    track: "company_track",
    company_id: "lnt_get_2027",
    topic: "L&T Automation Systems",
    difficulty: "medium",
    question: "In an EPC automation project, what safety integrity level architecture standard requires dual redundant 1oo2D or 2oo3 voting for critical emergency shutdown (ESD) valves?",
    options: [
      { id: "A", text: "IEC 61508 / IEC 61511 (SIL-3)" },
      { id: "B", text: "ISO 9001 (Quality Assurance)" },
      { id: "C", text: "IEEE 802.3 Ethernet standard" },
      { id: "D", text: "NEMA 4X weatherproofing" }
    ],
    correct_option_id: "A",
    correct_answer: "IEC 61508 / IEC 61511 (SIL-3)",
    explanation: "IEC 61508 and sector standard IEC 61511 govern functional safety of safety instrumented systems (SIS) in process industries. SIL-3 requirements commonly dictate 1oo2D or 2oo3 redundant voting architectures.",
    recommended_time_seconds: 60,
    provenance: { company: "L&T GET 2027", role: "Automation & Control", type: "functional_safety" }
  },
  {
    id: "comp_tcs_01",
    track: "company_track",
    company_id: "tcs_prime_2027",
    topic: "TCS Prime Advanced Reasoning",
    difficulty: "medium",
    question: "In a computational sorting workflow of n sensor log packets, what is the worst-case asymptotic time complexity of standard Merge Sort?",
    options: [
      { id: "A", text: "O(n log n)" },
      { id: "B", text: "O(n^2)" },
      { id: "C", text: "O(n)" },
      { id: "D", text: "O(log n)" }
    ],
    correct_option_id: "A",
    correct_answer: "O(n log n)",
    explanation: "Merge Sort uses a divide-and-conquer strategy: log2(n) division levels with linear O(n) merging work per level. Its best, average, and worst-case time complexities are all strictly O(n log n).",
    recommended_time_seconds: 60,
    provenance: { company: "TCS Prime / Digital 2027", role: "Systems Engineer", type: "algorithms" }
  }
];

// Write individual dataset files
fs.writeFileSync(path.join(rootDir, 'questions_visual.json'), JSON.stringify({ version: "2.0", category: "visual_aptitude", questions: visualQuestions }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_quantitative.json'), JSON.stringify({ version: "2.0", category: "quantitative_aptitude", questions: quantitativeQuestions }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_logical.json'), JSON.stringify({ version: "2.0", category: "logical_reasoning", questions: logicalQuestions }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_verbal.json'), JSON.stringify({ version: "2.0", category: "verbal_ability", questions: [...verbalQuestions, ...standardVerbalQuestions] }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_data_interpretation.json'), JSON.stringify({ version: "2.0", category: "data_interpretation", questions: [...dataInterpretationQuestions, ...standardDIQuestions] }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_technical.json'), JSON.stringify({ version: "2.0", category: "technical_instrumentation", questions: technicalQuestions }, null, 2));
fs.writeFileSync(path.join(rootDir, 'questions_company_tracks.json'), JSON.stringify({ version: "2.0", category: "company_specific", questions: companyTrackQuestions }, null, 2));

// Merge all unique questions into question_bank.json
const allNewQuestions = [
  ...existingQuestions,
  ...visualQuestions,
  ...standardVerbalQuestions.filter(q => !existingQuestions.some(e => e.id === q.id)),
  ...standardDIQuestions.filter(q => !existingQuestions.some(e => e.id === q.id)),
  ...companyTrackQuestions.filter(q => !existingQuestions.some(e => e.id === q.id))
];

// Deduplicate by ID
const uniqueQuestionsMap = new Map();
for (const q of allNewQuestions) {
  uniqueQuestionsMap.set(q.id, q);
}
const finalQuestionsList = Array.from(uniqueQuestionsMap.values());

const masterBank = {
  version: "2.0.0",
  last_updated: "2026-10-16T20:00:00+05:30",
  total_questions: finalQuestionsList.length,
  questions: finalQuestionsList
};

fs.writeFileSync(path.join(rootDir, 'question_bank.json'), JSON.stringify(masterBank, null, 2));

console.log(`[question_builder] Master question bank updated: ${finalQuestionsList.length} total questions.`);
console.log(`- Visual Reasoning: ${visualQuestions.length}`);
console.log(`- Quantitative: ${quantitativeQuestions.length}`);
console.log(`- Logical: ${logicalQuestions.length}`);
console.log(`- Verbal: ${verbalQuestions.length + standardVerbalQuestions.length}`);
console.log(`- Data Interpretation: ${dataInterpretationQuestions.length + standardDIQuestions.length}`);
console.log(`- Technical Instrumentation: ${technicalQuestions.length}`);
console.log(`- Company Specific Tracks: ${companyTrackQuestions.length}`);

// Sync to SQLite database
const db = new Database(path.join(rootDir, 'data', 'get_quest.db'));

// Check if diagram_spec_json column exists
const tableInfo = db.prepare("PRAGMA table_info(questions)").all();
const hasDiagramCol = tableInfo.some(c => c.name === 'diagram_spec_json');
if (!hasDiagramCol) {
  db.prepare("ALTER TABLE questions ADD COLUMN diagram_spec_json TEXT").run();
  console.log('[db] Added column diagram_spec_json to questions table.');
}

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO questions
    (id, track, topic, difficulty, question, options_json,
     correct_option_id, correct_answer, explanation,
     recommended_time_seconds, provenance_json, diagram_spec_json, is_active)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)
`);

const syncTx = db.transaction(() => {
  for (const q of finalQuestionsList) {
    insertStmt.run(
      q.id,
      q.track,
      q.topic,
      q.difficulty,
      q.question,
      JSON.stringify(q.options),
      q.correct_option_id,
      q.correct_answer,
      q.explanation,
      q.recommended_time_seconds || 60,
      JSON.stringify(q.provenance || {}),
      q.diagram_spec ? JSON.stringify(q.diagram_spec) : null
    );
  }
});

syncTx();
const dbCount = db.prepare("SELECT count(*) as count FROM questions").get().count;
console.log(`[db] Synced ${dbCount} questions into SQLite questions table.`);
