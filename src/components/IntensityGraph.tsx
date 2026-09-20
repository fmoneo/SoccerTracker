'use client';

import React, { useMemo, useState } from 'react';
import { Match, MatchEvent } from '../lib/types';
import { calculateCurrentElapsedSeconds } from '../lib/clock';

interface IntensityGraphProps {
  match: Match;
  events: MatchEvent[];
  swappedSides?: boolean;
}

// Event intensity weights (Positive for Home, Negative for Away)
const INTENSITY_WEIGHTS: Record<string, number> = {
  GOAL: 5.0,
  PENALTY: 4.5,
  SHOT_ON_TARGET: 4.0, // "the one being the highest, the ones that are like shots on target"
  SHOT: 2.5,          // shot off target
  CORNER_KICK: 2.2,
  FOUL: 1.2,
  THROW_IN: 0.8,
  SUBSTITUTION: 0.5,
};

export const IntensityGraph: React.FC<IntensityGraphProps> = ({
  match,
  events,
  swappedSides = false,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    minute: number;
    event?: MatchEvent;
    text: string;
  } | null>(null);

  // Match parameters (configurable half duration, default 30 mins)
  const halfMinute = match.halfDurationMinutes || 30;
  const totalMinutes = halfMinute * 2;

  // Viewport dimensions for SVG
  const width = 600;
  const height = 180;
  const padLeft = 32;
  const padRight = 32;
  const padTop = 26;
  const padBottom = 26;

  const graphWidth = width - padLeft - padRight;
  const graphHeight = height - padTop - padBottom;
  const zeroY = padTop + graphHeight / 2;

  // Determine which team is on top (Home is positive, Away is negative by default)
  // If sides are swapped, respect visual alignment
  const homeIsPositive = !swappedSides;
  const topTeam = homeIsPositive ? match.homeTeam : match.awayTeam;
  const bottomTeam = homeIsPositive ? match.awayTeam : match.homeTeam;

  // Current match minute
  const currentElapsedSec = calculateCurrentElapsedSeconds(match.clock);
  const currentMinute = Math.min(totalMinutes, currentElapsedSec / 60);

  // Compute momentum curve
  const { pathTop, pathBottom, maxVal, goalsList } = useMemo(() => {
    // 120 sample points along the match (every 30 seconds)
    const samplesCount = 121;
    const samples: number[] = new Array(samplesCount).fill(0);

    // Sigma for Gaussian decay around each event (approx 1.2 minutes)
    const sigma = 1.2;

    const goals: { event: MatchEvent; minute: number; isHome: boolean }[] = [];

    for (const ev of events) {
      const evMinute = Math.min(totalMinutes, Math.max(0, ev.matchTimeSeconds / 60));
      const weight = INTENSITY_WEIGHTS[ev.eventType] || 1.0;
      const isHome = ev.teamId === 'home';
      const sign = (isHome === homeIsPositive) ? 1 : -1;
      const intensity = weight * sign;

      if (ev.eventType === 'GOAL') {
        goals.push({ event: ev, minute: evMinute, isHome });
      }

      // Add Gaussian pulse to nearby sample points
      for (let i = 0; i < samplesCount; i++) {
        const t = (i / (samplesCount - 1)) * totalMinutes;
        const dist = t - evMinute;
        if (Math.abs(dist) <= 4.0) {
          samples[i] += intensity * Math.exp(-(dist * dist) / (2 * sigma * sigma));
        }
      }
    }

    // Find peak magnitude to normalize
    let peak = 3.0; // minimum baseline scale
    for (const s of samples) {
      if (Math.abs(s) > peak) peak = Math.abs(s);
    }

    // Convert samples to SVG points
    const pointsTop: { x: number; y: number }[] = [];
    const pointsBottom: { x: number; y: number }[] = [];

    for (let i = 0; i < samplesCount; i++) {
      const t = (i / (samplesCount - 1)) * totalMinutes;
      const x = padLeft + (t / totalMinutes) * graphWidth;
      const val = samples[i];
      const normalized = val / peak; // -1 to +1

      // y coordinate in SVG (y=0 is top, so positive goes up towards padTop)
      const y = zeroY - normalized * (graphHeight / 2);

      if (val >= 0) {
        pointsTop.push({ x, y });
        pointsBottom.push({ x, y: zeroY });
      } else {
        pointsTop.push({ x, y: zeroY });
        pointsBottom.push({ x, y });
      }
    }

    // Build smooth SVG area paths
    let dTop = `M ${padLeft} ${zeroY} `;
    for (let i = 0; i < pointsTop.length; i++) {
      dTop += `L ${pointsTop[i].x.toFixed(1)} ${pointsTop[i].y.toFixed(1)} `;
    }
    dTop += `L ${padLeft + graphWidth} ${zeroY} Z`;

    let dBottom = `M ${padLeft} ${zeroY} `;
    for (let i = 0; i < pointsBottom.length; i++) {
      dBottom += `L ${pointsBottom[i].x.toFixed(1)} ${pointsBottom[i].y.toFixed(1)} `;
    }
    dBottom += `L ${padLeft + graphWidth} ${zeroY} Z`;

    return {
      pathTop: dTop,
      pathBottom: dBottom,
      maxVal: peak,
      goalsList: goals,
    };
  }, [events, totalMinutes, graphWidth, graphHeight, homeIsPositive, padLeft, zeroY]);

  const timeToX = (minute: number) => padLeft + (Math.min(totalMinutes, Math.max(0, minute)) / totalMinutes) * graphWidth;

  const currentX = timeToX(currentMinute);
  const halfX = timeToX(halfMinute);

  return (
    <div className="intensity-graph-container" aria-label="Match Intensity and Momentum Graph">
      <div className="intensity-graph-header">
        <div className="intensity-title-group">
          <span className="intensity-badge">⚡ Match Flow</span>
          <span className="intensity-label">Attack Intensity & Momentum</span>
        </div>

        {/* Legend */}
        <div className="intensity-legend">
          <span className="legend-item top-team">
            <span className="legend-dot top-team" />
            {topTeam.name} (+Y)
          </span>
          <span className="legend-item bottom-team">
            <span className="legend-dot bottom-team" />
            {bottomTeam.name} (-Y)
          </span>
          <span className="legend-item goal-marker">
            <span>⚽</span> Goal
          </span>
        </div>
      </div>

      <div className="intensity-svg-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="intensity-graph-svg"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Top Area Gradient (Home/Top Team) */}
            <linearGradient id="topIntensityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>

            {/* Bottom Area Gradient (Away/Bottom Team) */}
            <linearGradient id="bottomIntensityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.02" />
              <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.7" />
            </linearGradient>

            <filter id="glowBall" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background gridlines */}
          <line
            x1={padLeft}
            y1={padTop + 10}
            x2={padLeft + graphWidth}
            y2={padTop + 10}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={height - padBottom - 10}
            x2={padLeft + graphWidth}
            y2={height - padBottom - 10}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="3 3"
          />

          {/* Center Zero Baseline */}
          <line
            x1={padLeft}
            y1={zeroY}
            x2={padLeft + graphWidth}
            y2={zeroY}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.2"
          />

          {/* Half-Time (30') Middle Divider */}
          <line
            x1={halfX}
            y1={padTop}
            x2={halfX}
            y2={height - padBottom}
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={halfX}
            y={padTop - 8}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fontWeight="bold"
          >
            HT ({halfMinute}&apos;)
          </text>

          {/* Top Momentum Area */}
          <path d={pathTop} fill="url(#topIntensityGrad)" />

          {/* Bottom Momentum Area */}
          <path d={pathBottom} fill="url(#bottomIntensityGrad)" />

          {/* Current Running Match Time Indicator */}
          {match.clock.phase !== 'NOT_STARTED' && (
            <g>
              <line
                x1={currentX}
                y1={padTop}
                x2={currentX}
                y2={height - padBottom}
                stroke="#10b981"
                strokeWidth="1.5"
              />
              <circle cx={currentX} cy={zeroY} r="3.5" fill="#10b981" />
            </g>
          )}

          {/* Goals markers with vertical dashed line and little soccer ball */}
          {goalsList.map((g, idx) => {
            const gx = timeToX(g.minute);
            const isTop = (g.isHome === homeIsPositive);
            const ballY = isTop ? padTop + 4 : height - padBottom - 4;
            const lineColor = isTop ? '#06b6d4' : '#f43f5e';
            const teamName = g.isHome ? match.homeTeam.name : match.awayTeam.name;

            return (
              <g
                key={`goal-${g.event.id || idx}`}
                className="goal-indicator-marker"
                onClick={() => {
                  setActiveTooltip({
                    x: gx,
                    y: ballY,
                    minute: Math.round(g.minute),
                    event: g.event,
                    text: `⚽ GOAL (${Math.round(g.minute)}') by ${teamName} ${g.event.details?.player || ''}`,
                  });
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical goal line */}
                <line
                  x1={gx}
                  y1={isTop ? padTop + 14 : zeroY}
                  x2={gx}
                  y2={isTop ? zeroY : height - padBottom - 14}
                  stroke={lineColor}
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  opacity="0.85"
                />

                {/* Soccer ball badge */}
                <circle
                  cx={gx}
                  cy={ballY}
                  r="9"
                  fill="#0f172a"
                  stroke={lineColor}
                  strokeWidth="1.5"
                  filter="url(#glowBall)"
                />
                <text
                  x={gx}
                  y={ballY + 4}
                  textAnchor="middle"
                  fontSize="11"
                  pointerEvents="none"
                >
                  ⚽
                </text>
              </g>
            );
          })}

          {/* X-Axis Minute Labels */}
          <text x={padLeft} y={height - 8} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
            0&apos;
          </text>
          <text x={timeToX(Math.round(halfMinute / 2))} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
            {Math.round(halfMinute / 2)}&apos;
          </text>
          <text x={halfX} y={height - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="bold">
            {halfMinute}&apos;
          </text>
          <text x={timeToX(Math.round(halfMinute + halfMinute / 2))} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
            {Math.round(halfMinute + halfMinute / 2)}&apos;
          </text>
          <text x={padLeft + graphWidth} y={height - 8} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
            {totalMinutes}&apos; FT
          </text>
        </svg>

        {/* Interactive Tooltip on Tap/Click */}
        {activeTooltip && (
          <div
            className="graph-tooltip"
            onClick={() => setActiveTooltip(null)}
          >
            <span>{activeTooltip.text}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '4px' }}>✕</span>
          </div>
        )}
      </div>
    </div>
  );
};
