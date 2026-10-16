import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Star,
  Compass,
  ArrowRight,
  Clock,
  Target,
  FileCheck2,
  X,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { StudyDay, StudyTask } from '../types';

export interface MapNode {
  id: string;
  type: 'level' | 'checkpoint' | 'cumulative';
  levelNumber: number;
  dayIndex: number;
  dayDate: string;
  dayLabel: string;
  title: string;
  topic: string;
  durationMinutes: number;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  taskRef?: StudyTask;
  objective?: string;
}

interface WindingLearningMapProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const WindingLearningMap: React.FC<WindingLearningMapProps> = ({ onNavigate }) => {
  const { studyPlan, refreshStudyPlan, currentDate, addToast, triggerConfetti } = useApp();
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const currentNodeRef = useRef<HTMLDivElement | null>(null);

  const days: StudyDay[] = studyPlan?.days || [];

  // Detect mobile width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Build sequential list of map nodes across all days
  const mapNodes: MapNode[] = [];
  let globalLevelCounter = 1;
  let runningCompletedCount = 0;

  days.forEach((day, dIdx) => {
    const tasks = day.tasks || [];
    tasks.forEach((task, tIdx) => {
      // Determine status based on task and prerequisites
      let status: MapNode['status'] = 'locked';
      if (task.status === 'completed') {
        status = 'completed';
        runningCompletedCount++;
      } else if (task.status === 'in_progress') {
        status = 'in_progress';
      } else if (tIdx === 0 && dIdx === 0) {
        status = 'available';
      }

      mapNodes.push({
        id: task.id,
        type: 'level',
        levelNumber: globalLevelCounter,
        dayIndex: dIdx,
        dayDate: day.date,
        dayLabel: day.label,
        title: task.task_text || `Level ${globalLevelCounter}`,
        topic: day.focus || 'Aptitude & Technical',
        durationMinutes: 45,
        status,
        taskRef: task,
        objective: day.targets?.[tIdx % (day.targets.length || 1)] || 'Master core fundamentals and problem solving.',
      });

      // Insert checkpoint assignment after every 5 completed or scheduled micro-levels
      if (globalLevelCounter % 5 === 0) {
        const isUnlocked = runningCompletedCount >= globalLevelCounter;
        mapNodes.push({
          id: `checkpoint_${globalLevelCounter}`,
          type: 'checkpoint',
          levelNumber: globalLevelCounter,
          dayIndex: dIdx,
          dayDate: day.date,
          dayLabel: day.label,
          title: `Checkpoint ${Math.floor(globalLevelCounter / 5)}: Multi-Discipline Drill`,
          topic: 'Mixed Aptitude, Visual & Engineering Fundamentals',
          durationMinutes: 30,
          status: isUnlocked ? (runningCompletedCount > globalLevelCounter ? 'completed' : 'available') : 'locked',
          objective: 'Pass comprehensive 10-question evaluation to unlock next mission phase.',
        });
      }

      globalLevelCounter++;
    });

    // End-of-day cumulative assessment node
    const isDayAllDone = tasks.length > 0 && tasks.every((t) => t.status === 'completed');
    mapNodes.push({
      id: `cumulative_${day.date}`,
      type: 'cumulative',
      levelNumber: globalLevelCounter,
      dayIndex: dIdx,
      dayDate: day.date,
      dayLabel: day.label,
      title: `End of Day Cumulative: ${day.label}`,
      topic: 'Full Spaced-Repetition & Mission Recap',
      durationMinutes: 25,
      status: isDayAllDone ? 'available' : 'locked',
      objective: 'Score >= 70% on daily cumulative mock to finalize mission progress.',
    });
  });

  // Ensure precisely ONE current level is marked 'in_progress' or 'available'
  let foundActive = false;
  for (let i = 0; i < mapNodes.length; i++) {
    const node = mapNodes[i];
    if (node.status === 'completed') continue;
    if (!foundActive) {
      node.status = 'in_progress';
      foundActive = true;
    } else {
      node.status = 'locked';
    }
  }

  const currentNode = mapNodes.find((n) => n.status === 'in_progress') || mapNodes[0];

  // Auto-scroll to active node on mount
  useEffect(() => {
    if (currentNodeRef.current) {
      currentNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentNode?.id]);

  // Handle Level Completion toggle
  const handleToggleNodeCompletion = async (node: MapNode) => {
    if (!node.taskRef) return;
    const isCompleted = node.status === 'completed';
    const nextStatus = isCompleted ? 'not_started' : 'completed';

    try {
      const res = await api.updateTask(node.taskRef.id, {
        status: nextStatus,
        actual_minutes: nextStatus === 'completed' ? 45 : 0,
      });

      if (nextStatus === 'completed') {
        addToast('Level Complete!', `Level ${node.levelNumber} passed (+${res.xpAwarded} XP)`, 'success');
        triggerConfetti();
      } else {
        addToast('Level Reset', 'Marked as pending.', 'info');
      }

      await refreshStudyPlan();
      setSelectedNode(null);
    } catch (err: any) {
      addToast('Error updating level', err.message, 'warning');
    }
  };

  // Launch assessment for checkpoint or cumulative node
  const handleLaunchAssessment = async (node: MapNode) => {
    try {
      const assessType = node.type === 'checkpoint' ? 'checkpoint' : 'daily_cumulative';
      const assessment = await api.generateAssessment(assessType, node.dayDate);
      onNavigate('test-runner', { config: assessment });
    } catch (err: any) {
      addToast('Assessment Error', err.message, 'warning');
    }
  };

  // Layout parameters for winding path
  const viewBoxWidth = isMobile ? 360 : 700;
  const nodeYSpacing = isMobile ? 96 : 100;
  const amplitude = isMobile ? 80 : 200;
  const centerX = viewBoxWidth / 2;
  const totalHeight = (mapNodes.length + 1) * nodeYSpacing;

  // Compute (x, y) for each node along a smooth sinusoidal curve
  const nodePositions = mapNodes.map((_, i) => {
    const y = (i + 1) * nodeYSpacing;
    const angle = i * 0.9;
    const x = isMobile ? centerX + Math.sin(angle) * amplitude : centerX + Math.sin(angle) * amplitude;
    return { x, y };
  });

  // Construct SVG cubic bezier curve connecting all nodes
  let pathD = '';
  if (nodePositions.length > 0) {
    pathD = `M ${nodePositions[0].x} ${nodePositions[0].y}`;
    for (let i = 0; i < nodePositions.length - 1; i++) {
      const curr = nodePositions[i];
      const next = nodePositions[i + 1];
      const cp1y = curr.y + (next.y - curr.y) * 0.5;
      const cp2y = curr.y + (next.y - curr.y) * 0.5;
      pathD += ` C ${curr.x} ${cp1y}, ${next.x} ${cp2y}, ${next.x} ${next.y}`;
    }
  }

  // Calculate completed path length index for animated trail
  const lastCompletedIndex = mapNodes.findLastIndex((n) => n.status === 'completed');

  return (
    <div className="learning-map-container" style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      {/* Top Banner: Today's Mission & Quick Continue */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-light))',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              TODAY'S MISSION
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
              {currentDate} (IST)
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 2px' }}>
            {currentNode ? `${currentNode.title}` : 'Mission In Progress'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            {currentNode?.topic} • {currentNode?.durationMinutes} mins recommended
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {currentNode && (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (currentNode.type === 'checkpoint' || currentNode.type === 'cumulative') {
                  handleLaunchAssessment(currentNode);
                } else {
                  setSelectedNode(currentNode);
                }
              }}
              style={{
                padding: '10px 20px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(27, 94, 181, 0.35)',
              }}
            >
              <Play size={16} fill="currentColor" />
              <span>Continue Current Level</span>
            </button>
          )}
        </div>
      </div>

      {/* Map Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 20,
          padding: '8px 16px',
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--emerald-success)' }} />
          Completed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.3)' }} />
          Current Focus
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px dashed var(--blue)' }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
          Locked
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Star size={14} color="var(--amber-warning)" />
          Checkpoint
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={14} color="var(--purple)" />
          Cumulative Final
        </span>
      </div>

      {/* Winding Illustrated Learning Journey SVG */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <svg
          width={viewBoxWidth}
          height={totalHeight}
          viewBox={`0 0 ${viewBoxWidth} ${totalHeight}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Trail animated dash pattern */}
            <linearGradient id="pathProgressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--emerald-success)" />
              <stop offset="70%" stopColor="var(--blue)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>

            <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--blue)" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background neutral connecting trail */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--border)"
            strokeWidth={isMobile ? 8 : 10}
            strokeLinecap="round"
          />

          {/* Animated active progress trail */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#pathProgressGrad)"
            strokeWidth={isMobile ? 6 : 8}
            strokeLinecap="round"
            strokeDasharray="12 8"
            className="animated-learning-path"
          />

          {/* Render Level Nodes */}
          {mapNodes.map((node, idx) => {
            const pos = nodePositions[idx];
            if (!pos) return null;

            const isCurrent = node.status === 'in_progress';
            const isCompleted = node.status === 'completed';
            const isLocked = node.status === 'locked';
            const isCheckpoint = node.type === 'checkpoint';
            const isCumulative = node.type === 'cumulative';

            const nodeRadius = isCheckpoint || isCumulative ? 28 : 24;

            let fillColor = 'var(--bg-surface)';
            let strokeColor = 'var(--border)';
            let iconColor = 'var(--text-tertiary)';

            if (isCompleted) {
              fillColor = 'var(--emerald-success)';
              strokeColor = 'var(--emerald-border)';
              iconColor = '#ffffff';
            } else if (isCurrent) {
              fillColor = 'var(--blue)';
              strokeColor = 'var(--cyan)';
              iconColor = '#ffffff';
            } else if (isCheckpoint) {
              fillColor = 'var(--bg-surface)';
              strokeColor = 'var(--amber-warning)';
              iconColor = 'var(--amber-warning)';
            } else if (isCumulative) {
              fillColor = 'var(--bg-surface)';
              strokeColor = 'var(--purple)';
              iconColor = 'var(--purple)';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                opacity={isLocked ? 0.65 : 1}
              >
                {/* Current node pulsing aura */}
                {isCurrent && (
                  <circle
                    r={nodeRadius + 10}
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth={2}
                    className="pulse-aura"
                  />
                )}

                {/* Base node circle */}
                <circle
                  r={nodeRadius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isCurrent ? 4 : 2.5}
                  filter={isCurrent ? 'url(#nodeGlow)' : undefined}
                />

                {/* Node Interior Icon or Level Number */}
                {isCompleted ? (
                  <CheckCircle2
                    x={-10}
                    y={-10}
                    size={20}
                    color="#ffffff"
                    strokeWidth={3}
                  />
                ) : isLocked ? (
                  <Lock
                    x={-8}
                    y={-8}
                    size={16}
                    color="var(--text-tertiary)"
                  />
                ) : isCheckpoint ? (
                  <Star
                    x={-10}
                    y={-10}
                    size={20}
                    color={iconColor}
                    fill={isCompleted ? '#ffffff' : 'currentColor'}
                  />
                ) : isCumulative ? (
                  <Trophy
                    x={-10}
                    y={-10}
                    size={20}
                    color={iconColor}
                  />
                ) : (
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fill={isCurrent ? '#ffffff' : 'var(--text-main)'}
                    fontFamily="var(--font-m)"
                    fontWeight={700}
                    fontSize={13}
                  >
                    {node.levelNumber}
                  </text>
                )}

                {/* Floating "You Are Here" Marker */}
                {isCurrent && (
                  <g transform="translate(0, -42)" className="bounce-marker">
                    <rect
                      x={-42}
                      y={-14}
                      width={84}
                      height={20}
                      rx={10}
                      fill="var(--navy)"
                      stroke="var(--cyan)"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={9}
                      fontWeight={700}
                      fontFamily="var(--font-m)"
                    >
                      YOU ARE HERE
                    </text>
                    <polygon points="-4,6 4,6 0,11" fill="var(--navy)" />
                  </g>
                )}

                {/* Node Title Label placed on side */}
                <g
                  transform={`translate(${pos.x > centerX ? -(nodeRadius + 12) : nodeRadius + 12}, 0)`}
                  textAnchor={pos.x > centerX ? 'end' : 'start'}
                >
                  <text
                    x={0}
                    y={-4}
                    fill="var(--text-main)"
                    fontSize={12}
                    fontWeight={600}
                    fontFamily="var(--font-sans)"
                  >
                    {node.type === 'checkpoint'
                      ? '⭐ Milestone Checkpoint'
                      : node.type === 'cumulative'
                      ? '🏆 Daily Cumulative'
                      : `Level ${node.levelNumber}`}
                  </text>
                  <text
                    x={0}
                    y={12}
                    fill="var(--text-tertiary)"
                    fontSize={10}
                    fontFamily="var(--font-m)"
                  >
                    {node.durationMinutes}m • {node.dayLabel}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Details Drawer / Popover Modal */}
      {selectedNode && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedNode(null)}
          style={{ animation: 'fadeIn 0.15s ease' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, width: '100%', padding: '24px 28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', marginBottom: 6 }}>
                  {selectedNode.type === 'checkpoint'
                    ? 'CHECKPOINT MILESTONE'
                    : selectedNode.type === 'cumulative'
                    ? 'DAILY CUMULATIVE ASSESSMENT'
                    : `MICRO-LEVEL 0${selectedNode.levelNumber}`}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0' }}>
                  {selectedNode.title}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-m)' }}>
                  {selectedNode.dayLabel} ({selectedNode.dayDate})
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedNode(null)}
                style={{ borderRadius: '50%', width: 32, height: 32, padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Objective & Topic */}
            <div style={{ background: 'var(--bg-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                Core Objective
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                {selectedNode.objective}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color="var(--cyan)" /> {selectedNode.durationMinutes} mins
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={13} color="var(--blue)" /> {selectedNode.topic}
                </span>
              </div>
            </div>

            {/* Action Buttons based on Node State */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {selectedNode.taskRef && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleToggleNodeCompletion(selectedNode)}
                >
                  <RotateCcw size={15} />
                  <span>{selectedNode.status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}</span>
                </button>
              )}

              {selectedNode.type === 'checkpoint' || selectedNode.type === 'cumulative' ? (
                <button
                  className="btn btn-primary"
                  disabled={selectedNode.status === 'locked'}
                  onClick={() => handleLaunchAssessment(selectedNode)}
                >
                  <Play size={15} />
                  <span>Start Assessment Drill</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedNode(null);
                    onNavigate('practice', { topic: selectedNode.topic });
                  }}
                >
                  <Play size={15} />
                  <span>Start Practice Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes dashMove {
          to {
            stroke-dashoffset: -40;
          }
        }
        .animated-learning-path {
          animation: dashMove 2s linear infinite;
        }
        @keyframes pulseRing {
          0% {
            r: 32px;
            opacity: 0.8;
          }
          100% {
            r: 46px;
            opacity: 0;
          }
        }
        .pulse-aura {
          animation: pulseRing 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }
        @keyframes bobbing {
          0%, 100% {
            transform: translate(0, -42px);
          }
          50% {
            transform: translate(0, -47px);
          }
        }
        .bounce-marker {
          animation: bobbing 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animated-learning-path,
          .pulse-aura,
          .bounce-marker {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
