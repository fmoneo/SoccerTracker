'use client';

import React, { useState } from 'react';
import { Match, MatchEvent, EventType } from '../lib/types';
import { MatchClock } from './MatchClock';
import { calculateTeamStats } from '../lib/stats';
import { IntensityGraph } from './IntensityGraph';
import { ArrowLeftRight, UserCheck, Activity } from 'lucide-react';
import { playTapSound, triggerHaptic } from '../lib/sound';

interface ScoreboardProps {
  match: Match;
  events: MatchEvent[];
  swappedSides: boolean;
  tagPlayerMode: boolean;
  onToggleSides: () => void;
  onToggleTagPlayer: () => void;
  onUpdateTeamName: (side: 'home' | 'away', name: string) => void;
  onUpdateClock: (
    clock: Match['clock'],
    boundaryEvent?: { eventType: EventType; notes: string }
  ) => void;
  onChangeHalfMinutes?: (minutes: number) => void;
  onXaviHighlight?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  match,
  events,
  swappedSides,
  tagPlayerMode,
  onToggleSides,
  onToggleTagPlayer,
  onUpdateTeamName,
  onUpdateClock,
  onChangeHalfMinutes,
  onXaviHighlight,
}) => {
  const [showFlowGraph, setShowFlowGraph] = useState(false);

  const homeStats = calculateTeamStats(events, 'home');
  const awayStats = calculateTeamStats(events, 'away');

  const isFullTime = match.clock.phase === 'FULL_TIME';

  // Determine left and right team based on swappedSides
  const leftSide = swappedSides ? 'away' : 'home';
  const rightSide = swappedSides ? 'home' : 'away';

  const leftTeam = leftSide === 'home' ? match.homeTeam : match.awayTeam;
  const rightTeam = rightSide === 'home' ? match.homeTeam : match.awayTeam;

  const leftStats = leftSide === 'home' ? homeStats : awayStats;
  const rightStats = rightSide === 'home' ? homeStats : awayStats;

  return (
    <section className="match-hub-card sticky-hub" aria-label="Scoreboard and Match Clock">
      {/* Top Utility bar for pitch management */}
      <div className="hub-top-bar">
        <button
          type="button"
          className="hub-tool-btn"
          onClick={onToggleSides}
          title="Swap Left/Right team columns to match pitch view"
          aria-label="Swap team sides"
        >
          <ArrowLeftRight size={13} />
          <span>{swappedSides ? 'Inverted' : 'Swap Sides'}</span>
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Toggle Flow Graph button (only needed if user wants to peek before Full Time) */}
          {!isFullTime && (
            <button
              type="button"
              className={`hub-tool-btn ${showFlowGraph ? 'active' : ''}`}
              onClick={() => setShowFlowGraph((prev) => !prev)}
              title="Peek at Match Flow Graph"
              aria-label="Toggle Match Flow graph preview"
            >
              <Activity size={13} />
              <span>Flow {showFlowGraph ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <button
            type="button"
            className={`hub-tool-btn ${tagPlayerMode ? 'active' : ''}`}
            onClick={onToggleTagPlayer}
            title="Toggle jersey number prompt when recording events"
            aria-label="Toggle player jersey number tagging"
          >
            <UserCheck size={13} />
            <span>Tag #{tagPlayerMode ? ' ON' : ' OFF'}</span>
          </button>
        </div>
      </div>

      {/* Spacious Teams & Big Score Row: Names are fully visible without truncation */}
      <div className="scoreboard-teams-banner">
        {/* Left Team Block */}
        <div className={`team-banner-side ${leftSide}`}>
          <div className={`team-badge-avatar ${leftSide}`} aria-hidden="true">
            {leftTeam.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="team-banner-info">
            <input
              type="text"
              className="team-banner-name-input"
              value={leftTeam.name}
              onChange={(e) => onUpdateTeamName(leftSide, e.target.value)}
              aria-label={`${leftTeam.name} name`}
              title="Click to rename team"
            />
            <span className={`team-side-tag ${leftSide}`}>
              {leftSide === 'home' ? 'Home' : 'Away'}
            </span>
          </div>
        </div>

        {/* Center Score */}
        <div
          className="scoreboard-center-score"
          role="status"
          aria-label={`Score: ${leftTeam.name} ${leftStats.goals}, ${rightTeam.name} ${rightStats.goals}`}
        >
          <span className={`score-num ${leftSide}`}>{leftStats.goals}</span>
          <span className="score-separator">:</span>
          <span className={`score-num ${rightSide}`}>{rightStats.goals}</span>
        </div>

        {/* Right Team Block */}
        <div className={`team-banner-side ${rightSide} right-align`}>
          <div className="team-banner-info right-align">
            <input
              type="text"
              className="team-banner-name-input right-align"
              value={rightTeam.name}
              onChange={(e) => onUpdateTeamName(rightSide, e.target.value)}
              aria-label={`${rightTeam.name} name`}
              title="Click to rename team"
            />
            <span className={`team-side-tag ${rightSide}`}>
              {rightSide === 'home' ? 'Home' : 'Away'}
            </span>
          </div>
          <div className={`team-badge-avatar ${rightSide}`} aria-hidden="true">
            {rightTeam.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Xavi #11 Jersey Highlight Button — positioned under the Home team side */}
      {onXaviHighlight && (
        <div className="xavi-scoreboard-row">
          <button
            type="button"
            className="action-btn xavi-btn xavi-btn-compact"
            onClick={() => {
              triggerHaptic(20);
              playTapSound();
              onXaviHighlight();
            }}
            title="Log a Xavi highlight moment!"
            aria-label="Xavi highlight"
          >
            <div className="xavi-jersey-inner" aria-hidden="true">
              <span className="xavi-name">XAVI</span>
              <span className="xavi-number">11</span>
            </div>
          </button>
        </div>
      )}

      {/* Match Clock & Phase Controls */}
      <div className="scoreboard-clock-row">
        <MatchClock
          clock={match.clock}
          halfMinutes={match.halfDurationMinutes || 30}
          onUpdateClock={onUpdateClock}
          onChangeHalfMinutes={onChangeHalfMinutes}
        />
      </div>

      {/* Match Flow Graph: Only shown once the match ends (or if manually toggled) */}
      {(isFullTime || showFlowGraph) && (
        <div className="post-match-flow-section">
          <IntensityGraph
            match={match}
            events={events}
            swappedSides={swappedSides}
          />
        </div>
      )}
    </section>
  );
};
