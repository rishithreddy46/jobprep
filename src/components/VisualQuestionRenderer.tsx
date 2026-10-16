import React from 'react';

/**
 * Shape types supported by the vector engine
 */
export interface VisualShape {
  kind: 'circle' | 'rect' | 'line' | 'polygon' | 'arrow' | 'dot' | 'text' | 'star' | 'dice_face' | 'fold_line' | 'cross';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  r?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  points?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  rotation?: number;
  text?: string;
  fontSize?: number;
  dots?: number[]; // For dice faces: array of dot positions [1..9]
}

export interface FigureFrame {
  id?: string;
  label?: string;
  shapes: VisualShape[];
  width?: number;
  height?: number;
}

export interface VisualDiagramSpec {
  type: 
    | 'sequence'
    | 'analogy'
    | 'matrix'
    | 'mirror_water'
    | 'paper_folding'
    | 'dice'
    | 'count_shapes'
    | 'single_figure'
    | 'odd_one_out';
  prompt_frames?: FigureFrame[];
  grid_size?: number; // 2 for 2x2, 3 for 3x3
  matrix_cells?: (FigureFrame | null)[]; // null represents the '?' cell
  left_figure?: FigureFrame;
  right_figure?: FigureFrame;
  axis_type?: 'vertical_mirror' | 'horizontal_water';
  fold_steps?: FigureFrame[];
  aria_label?: string;
  rule_explanation?: string;
}

interface FrameRendererProps {
  frame: FigureFrame;
  size?: number;
  isQuestionMark?: boolean;
  highlight?: boolean;
}

/**
 * Renders an individual visual frame into a crisp 120x120 SVG viewport
 */
export const SingleFrameSVG: React.FC<FrameRendererProps> = ({
  frame,
  size = 110,
  isQuestionMark = false,
  highlight = false,
}) => {
  const vbWidth = frame.width || 100;
  const vbHeight = frame.height || 100;

  if (isQuestionMark) {
    return (
      <div
        className="visual-frame visual-frame-question"
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          border: '2px dashed var(--blue)',
          background: 'rgba(27, 94, 181, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--blue)',
          fontWeight: 700,
          fontSize: '1.5rem',
          userSelect: 'none',
        }}
      >
        <span>?</span>
        {frame?.label && (
          <span style={{ fontSize: '0.65rem', marginTop: 2, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {frame.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`visual-frame ${highlight ? 'visual-frame-active' : ''}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        borderRadius: 8,
        border: highlight ? '2px solid var(--blue)' : '1px solid var(--border)',
        padding: 4,
        boxShadow: highlight ? '0 0 0 3px rgba(27, 94, 181, 0.15)' : 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        style={{ overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {frame.shapes.map((s, idx) => {
          const fill = s.fill || 'none';
          const stroke = s.stroke || 'var(--text-primary)';
          const strokeWidth = s.strokeWidth ?? 2;
          const transform = s.rotation ? `rotate(${s.rotation} ${s.x ?? 50} ${s.y ?? 50})` : undefined;

          switch (s.kind) {
            case 'circle':
              return (
                <circle
                  key={idx}
                  cx={s.x ?? 50}
                  cy={s.y ?? 50}
                  r={s.r ?? 20}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={s.strokeDasharray}
                  transform={transform}
                />
              );

            case 'rect':
              return (
                <rect
                  key={idx}
                  x={s.x ?? 10}
                  y={s.y ?? 10}
                  width={s.width ?? 80}
                  height={s.height ?? 80}
                  rx={4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={s.strokeDasharray}
                  transform={transform}
                />
              );

            case 'line':
              return (
                <line
                  key={idx}
                  x1={s.x1 ?? 10}
                  y1={s.y1 ?? 50}
                  x2={s.x2 ?? 90}
                  y2={s.y2 ?? 50}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={s.strokeDasharray}
                  strokeLinecap="round"
                  transform={transform}
                />
              );

            case 'polygon':
              return (
                <polygon
                  key={idx}
                  points={s.points || '50,15 90,85 10,85'}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={s.strokeDasharray}
                  strokeLinejoin="round"
                  transform={transform}
                />
              );

            case 'arrow': {
              const x1 = s.x1 ?? 50;
              const y1 = s.y1 ?? 80;
              const x2 = s.x2 ?? 50;
              const y2 = s.y2 ?? 20;
              return (
                <g key={idx} transform={transform}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                  <polygon
                    points={`${x2},${y2} ${x2 - 5},${y2 + 8} ${x2 + 5},${y2 + 8}`}
                    fill={stroke}
                  />
                </g>
              );
            }

            case 'dot':
              return (
                <circle
                  key={idx}
                  cx={s.x ?? 50}
                  cy={s.y ?? 50}
                  r={s.r ?? 4}
                  fill={stroke}
                />
              );

            case 'cross':
              return (
                <g key={idx} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" transform={transform}>
                  <line x1={(s.x ?? 50) - 12} y1={(s.y ?? 50) - 12} x2={(s.x ?? 50) + 12} y2={(s.y ?? 50) + 12} />
                  <line x1={(s.x ?? 50) + 12} y1={(s.y ?? 50) - 12} x2={(s.x ?? 50) - 12} y2={(s.y ?? 50) + 12} />
                </g>
              );

            case 'fold_line':
              return (
                <line
                  key={idx}
                  x1={s.x1 ?? 10}
                  y1={s.y1 ?? 50}
                  x2={s.x2 ?? 90}
                  y2={s.y2 ?? 50}
                  stroke="var(--coral)"
                  strokeWidth={1.5}
                  strokeDasharray="4,3"
                />
              );

            case 'text':
              return (
                <text
                  key={idx}
                  x={s.x ?? 50}
                  y={s.y ?? 55}
                  fontSize={s.fontSize ?? 14}
                  fontWeight={600}
                  fill={stroke}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="var(--font-m)"
                >
                  {s.text}
                </text>
              );

            case 'dice_face': {
              const dots = s.dots || [5];
              const dotCoords: Record<number, [number, number]> = {
                1: [30, 30], 2: [50, 30], 3: [70, 30],
                4: [30, 50], 5: [50, 50], 6: [70, 50],
                7: [30, 70], 8: [50, 70], 9: [70, 70],
              };
              return (
                <g key={idx}>
                  <rect
                    x={15}
                    y={15}
                    width={70}
                    height={70}
                    rx={10}
                    fill="var(--bg-light)"
                    stroke="var(--text-primary)"
                    strokeWidth={2}
                  />
                  {dots.map((d) => {
                    const coord = dotCoords[d];
                    if (!coord) return null;
                    return (
                      <circle
                        key={d}
                        cx={coord[0]}
                        cy={coord[1]}
                        r={4.5}
                        fill="var(--text-primary)"
                      />
                    );
                  })}
                </g>
              );
            }

            default:
              return null;
          }
        })}
      </svg>
      {frame.label && (
        <span
          style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-m)',
            color: 'var(--text-secondary)',
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {frame.label}
        </span>
      )}
    </div>
  );
};

interface VisualQuestionRendererProps {
  spec: VisualDiagramSpec;
  interactive?: boolean;
}

export const VisualQuestionRenderer: React.FC<VisualQuestionRendererProps> = ({ spec }) => {
  if (!spec) return null;

  return (
    <div
      className="visual-diagram-container"
      role="img"
      aria-label={spec.aria_label || 'Non-verbal visual reasoning puzzle diagram'}
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        background: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* 1. Sequence / Pattern Progression (e.g. Frame 1 -> Frame 2 -> Frame 3 -> ?) */}
      {spec.type === 'sequence' && spec.prompt_frames && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {spec.prompt_frames.map((frame, i) => (
            <React.Fragment key={i}>
              <SingleFrameSVG frame={frame} size={96} />
              {i < (spec.prompt_frames?.length || 0) - 1 && (
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '1.2rem' }}>→</span>
              )}
            </React.Fragment>
          ))}
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 700, fontSize: '1.2rem' }}>→</span>
          <SingleFrameSVG frame={{ shapes: [], label: 'Next' }} size={96} isQuestionMark />
        </div>
      )}

      {/* 2. Analogy (Figure A : Figure B :: Figure C : ?) */}
      {spec.type === 'analogy' && spec.prompt_frames && spec.prompt_frames.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <SingleFrameSVG frame={spec.prompt_frames[0]} size={96} />
          <span style={{ color: 'var(--blue)', fontWeight: 800, fontSize: '1.2rem' }}>:</span>
          <SingleFrameSVG frame={spec.prompt_frames[1]} size={96} />
          <span style={{ color: 'var(--blue)', fontWeight: 800, fontSize: '1.3rem' }}>::</span>
          <SingleFrameSVG frame={spec.prompt_frames[2]} size={96} />
          <span style={{ color: 'var(--blue)', fontWeight: 800, fontSize: '1.2rem' }}>:</span>
          <SingleFrameSVG frame={{ shapes: [], label: '?' }} size={96} isQuestionMark />
        </div>
      )}

      {/* 3. Matrix Completion (2x2 or 3x3 Grid) */}
      {spec.type === 'matrix' && spec.matrix_cells && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${spec.grid_size || 3}, auto)`,
            gap: 8,
            padding: 10,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          {spec.matrix_cells.map((cell, idx) => {
            if (!cell) {
              return <SingleFrameSVG key={idx} frame={{ shapes: [], label: '?' }} size={84} isQuestionMark />;
            }
            return <SingleFrameSVG key={idx} frame={cell} size={84} />;
          })}
        </div>
      )}

      {/* 4. Mirror & Water Reflection */}
      {spec.type === 'mirror_water' && spec.left_figure && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
          <SingleFrameSVG frame={spec.left_figure} size={100} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'var(--cyan)',
              fontFamily: 'var(--font-m)',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ width: 2, height: 70, background: 'var(--cyan)', borderStyle: 'dashed' }} />
            <span>{spec.axis_type === 'horizontal_water' ? 'Water Surface' : 'Mirror Line (M-N)'}</span>
          </div>
          <SingleFrameSVG frame={{ shapes: [], label: 'Reflection' }} size={100} isQuestionMark />
        </div>
      )}

      {/* 5. Paper Folding / Cutting Steps */}
      {spec.type === 'paper_folding' && spec.fold_steps && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {spec.fold_steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <SingleFrameSVG frame={step} size={90} />
              {idx < (spec.fold_steps?.length || 0) - 1 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', fontWeight: 700 }}>→</span>
              )}
            </React.Fragment>
          ))}
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', fontWeight: 700 }}>→</span>
          <SingleFrameSVG frame={{ shapes: [], label: 'Unfolded' }} size={90} isQuestionMark />
        </div>
      )}

      {/* 6. Single Figure / Shape Counting */}
      {(spec.type === 'single_figure' || spec.type === 'count_shapes' || spec.type === 'dice') && spec.prompt_frames && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {spec.prompt_frames.map((frame, i) => (
            <SingleFrameSVG key={i} frame={frame} size={110} />
          ))}
        </div>
      )}

      {/* Accessible caption */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        {spec.aria_label || 'Deterministic vector diagram — offline vector rendering'}
      </div>
    </div>
  );
};
