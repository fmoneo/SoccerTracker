'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Target,
  Zap,
  AlertTriangle,
  Flag,
  CircleDot,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';
import { EventType, Match, MatchEvent, TeamId } from '../lib/types';
import { calculateTeamStats } from '../lib/stats';
import { playGoalSound, playTapSound, triggerHaptic } from '../lib/sound';

interface SplitActionBoardProps {
  match: Match;
  events: MatchEvent[];
  swappedSides: boolean;
  tagPlayerMode: boolean;
  onTriggerEvent: (teamId: TeamId, eventType: EventType, details?: MatchEvent['details']) => void;
  onRequestSub: (teamId: TeamId) => void;
  onRequestPlayerTag: (teamId: TeamId, eventType: EventType, details?: MatchEvent['details']) => void;
}

export const SplitActionBoard: React.FC<SplitActionBoardProps> = ({
  match,
  events,
  swappedSides,
  tagPlayerMode,
  onTriggerEvent,
  onRequestSub,
  onRequestPlayerTag,
}) => {
  // Great Save temporary state (active for 4 seconds after Shot on Target)
  const [greatSaveHome, setGreatSaveHome] = useState(false);
  const [greatSaveAway, setGreatSaveAway] = useState(false);
  const greatSaveTimers = useRef<{ home: NodeJS.Timeout | null; away: NodeJS.Timeout | null }>({
    home: null,
    away: null,
  });

  // Foul sub-menu state ('No Card', 'Yellow', 'Red')
  const [foulMenuTeam, setFoulMenuTeam] = useState<TeamId | null>(null);
  const foulMenuTimer = useRef<NodeJS.Timeout | null>(null);

  // Penalty sub-menu state ('Goal (PK)' or 'Missed')
  const [penaltyMenuTeam, setPenaltyMenuTeam] = useState<TeamId | null>(null);
  const penaltyMenuTimer = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    const timers = greatSaveTimers.current;
    return () => {
      if (timers.home) clearTimeout(timers.home);
      if (timers.away) clearTimeout(timers.away);
      if (foulMenuTimer.current) clearTimeout(foulMenuTimer.current);
      if (penaltyMenuTimer.current) clearTimeout(penaltyMenuTimer.current);
    };
  }, []);

  const homeStats = calculateTeamStats(events, 'home');
  const awayStats = calculateTeamStats(events, 'away');

  // Trigger Great Save for opposing goalkeeper
  const handleGreatSave = (attackingTeamId: TeamId) => {
    triggerHaptic([30, 40]);
    playTapSound();

    const defendingTeamId: TeamId = attackingTeamId === 'home' ? 'away' : 'home';

    if (attackingTeamId === 'home') {
      if (greatSaveTimers.current.home) clearTimeout(greatSaveTimers.current.home);
      setGreatSaveHome(false);
    } else {
      if (greatSaveTimers.current.away) clearTimeout(greatSaveTimers.current.away);
      setGreatSaveAway(false);
    }

    onTriggerEvent(defendingTeamId, 'GREAT_SAVE');
  };

  // Handle Foul card selection
  const handleSelectFoul = (teamId: TeamId, card?: 'yellow' | 'red') => {
    triggerHaptic(25);
    playTapSound();

    if (foulMenuTimer.current) clearTimeout(foulMenuTimer.current);
    setFoulMenuTeam(null);

    const details = card ? { card } : undefined;

    if (tagPlayerMode) {
      onRequestPlayerTag(teamId, 'FOUL', details);
    } else {
      onTriggerEvent(teamId, 'FOUL', details);
    }
  };

  // Handle Penalty outcome selection
  const handleSelectPenalty = (teamId: TeamId, outcome: 'goal' | 'missed') => {
    if (penaltyMenuTimer.current) clearTimeout(penaltyMenuTimer.current);
    setPenaltyMenuTeam(null);

    if (outcome === 'goal') {
      // A PK goal: treat like a GOAL but tag details.pk = true
      triggerHaptic([50, 40, 60]);
      playGoalSound();
      if (tagPlayerMode) {
        onRequestPlayerTag(teamId, 'GOAL', { pk: true });
      } else {
        onTriggerEvent(teamId, 'GOAL', { pk: true });
      }
    } else {
      // Missed penalty
      triggerHaptic([20, 20]);
      playTapSound();
      onTriggerEvent(teamId, 'PENALTY', { missed: true });
    }
  };

  const handleAction = (teamId: TeamId, type: EventType) => {
    if (type === 'SUBSTITUTION') {
      triggerHaptic(25);
      onRequestSub(teamId);
      return;
    }

    // Shot on Target: activate "Great Save" button with glove for 4 seconds
    if (type === 'SHOT_ON_TARGET') {
      if (teamId === 'home') {
        if (greatSaveTimers.current.home) clearTimeout(greatSaveTimers.current.home);
        setGreatSaveHome(true);
        greatSaveTimers.current.home = setTimeout(() => {
          setGreatSaveHome(false);
        }, 4000);
      } else {
        if (greatSaveTimers.current.away) clearTimeout(greatSaveTimers.current.away);
        setGreatSaveAway(true);
        greatSaveTimers.current.away = setTimeout(() => {
          setGreatSaveAway(false);
        }, 4000);
      }
    }

    if (tagPlayerMode && (type === 'GOAL' || type === 'SHOT_ON_TARGET' || type === 'SHOT' || type === 'PENALTY')) {
      triggerHaptic(25);
      if (type === 'GOAL') playGoalSound();
      else playTapSound();
      onRequestPlayerTag(teamId, type);
      return;
    }

    if (type === 'GOAL') {
      triggerHaptic([50, 40, 60]);
      playGoalSound();
      onTriggerEvent(teamId, type);
    } else {
      triggerHaptic(20);
      playTapSound();
      onTriggerEvent(teamId, type);
    }
  };

  const renderTeamColumn = (teamId: TeamId) => {
    const isHome = teamId === 'home';
    const team = isHome ? match.homeTeam : match.awayTeam;
    const stats = isHome ? homeStats : awayStats;
    const sideClass = isHome ? 'home' : 'away';

    const isGreatSaveActive = isHome ? greatSaveHome : greatSaveAway;
    const isFoulMenuOpen = foulMenuTeam === teamId;
    const isPenaltyMenuOpen = penaltyMenuTeam === teamId;

    return (
      <section key={teamId} className={`team-action-column ${sideClass}`} aria-label={`${team.name} actions`}>
        <div className="column-header">
          <div className={`column-title ${sideClass}`}>
            <span>{team.name}</span>
          </div>
          <span className={`team-side-tag ${sideClass}`}>
            {isHome ? 'Home' : 'Away'}
          </span>
        </div>

        <div className="actions-grid">
          {/* 1. GOAL (Soccer ball icon only) */}
          <button
            type="button"
            className={`action-btn goal ${sideClass}`}
            onClick={() => handleAction(teamId, 'GOAL')}
            title={`Record Goal for ${team.name}`}
            aria-label={`Goal for ${team.name}`}
          >
            <div className="btn-icon">
              <span style={{ fontSize: '26px', lineHeight: 1 }} role="img" aria-label="Soccer ball">⚽</span>
            </div>
            <span className="btn-label">GOAL</span>
            <span className="btn-count-badge" title="Goals scored">
              {stats.goals}
            </span>
          </button>

          {/* 2. SHOT ON TARGET / GREAT SAVE (Turns into Great Save with glove for 4s) */}
          {isGreatSaveActive ? (
            <button
              type="button"
              className={`action-btn great-save-active ${sideClass}`}
              onClick={() => handleGreatSave(teamId)}
              title="Click if opposing goalkeeper made a Great Save!"
              aria-label="Opposing goalkeeper Great Save"
            >
              <div className="btn-icon">
                <span style={{ fontSize: '22px', lineHeight: 1 }} role="img" aria-label="Glove">🧤</span>
              </div>
              <span className="btn-label great-save-label">Great Save?</span>
              <span className="btn-count-badge" style={{ background: '#0284c7', color: '#fff' }}>
                4s
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={`action-btn ${sideClass}`}
              onClick={() => handleAction(teamId, 'SHOT_ON_TARGET')}
              title={`Record Shot on Target for ${team.name}`}
              aria-label={`Shot on target for ${team.name}`}
            >
              <div className="btn-icon">
                <Target size={22} color={isHome ? '#38bdf8' : '#fb7185'} />
              </div>
              <span className="btn-label">Shot on Target</span>
              <span className="btn-count-badge" title="Shots on target">
                {stats.shotsOnTarget}
              </span>
            </button>
          )}

          {/* 3. SHOT (Off Target) */}
          <button
            type="button"
            className={`action-btn ${sideClass}`}
            onClick={() => handleAction(teamId, 'SHOT')}
            title={`Record Shot (Off Target) for ${team.name}`}
            aria-label={`Shot for ${team.name}`}
          >
            <div className="btn-icon">
              <Zap size={22} color="#94a3b8" />
            </div>
            <span className="btn-label">Shot (Off Target)</span>
            <span className="btn-count-badge" title="Shots off target">
              {stats.shotsOffTarget}
            </span>
          </button>

          {/* 4. FOUL: Morphs into 3 buttons (No card, Yellow, Red) when pressed */}
          {isFoulMenuOpen ? (
            <div className="foul-split-container">
              <button
                type="button"
                className="foul-sub-btn no-card"
                onClick={() => handleSelectFoul(teamId, undefined)}
                title="Foul without card"
              >
                <span>No Card</span>
              </button>
              <button
                type="button"
                className="foul-sub-btn yellow-card"
                onClick={() => handleSelectFoul(teamId, 'yellow')}
                title="Yellow Card"
              >
                <span>🟨 Yellow</span>
              </button>
              <button
                type="button"
                className="foul-sub-btn red-card"
                onClick={() => handleSelectFoul(teamId, 'red')}
                title="Red Card"
              >
                <span>🟥 Red</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`action-btn ${sideClass}`}
              onClick={() => {
                triggerHaptic(20);
                playTapSound();
                if (foulMenuTimer.current) clearTimeout(foulMenuTimer.current);
                setFoulMenuTeam(teamId);
                foulMenuTimer.current = setTimeout(() => {
                  setFoulMenuTeam(null);
                }, 5000);
              }}
              title={`Record Foul for ${team.name}`}
              aria-label={`Foul for ${team.name}`}
            >
              <div className="btn-icon">
                <AlertTriangle size={22} color="#fbbf24" />
              </div>
              <span className="btn-label">Foul</span>
              <span className="btn-count-badge" title="Total fouls">
                {stats.fouls}
              </span>
            </button>
          )}

          {/* 5. CORNER KICK */}
          <button
            type="button"
            className={`action-btn ${sideClass}`}
            onClick={() => handleAction(teamId, 'CORNER_KICK')}
            title={`Record Corner Kick for ${team.name}`}
            aria-label={`Corner kick for ${team.name}`}
          >
            <div className="btn-icon">
              <Flag size={22} color={isHome ? '#06b6d4' : '#f43f5e'} />
            </div>
            <span className="btn-label">Corner Kick</span>
            <span className="btn-count-badge" title="Corner kicks">
              {stats.corners}
            </span>
          </button>

          {/* 6. PENALTY → submenu: Goal (PK) or Missed */}
          {isPenaltyMenuOpen ? (
            <div className="penalty-split-container">
              <button
                type="button"
                className="penalty-sub-btn pk-goal"
                onClick={() => handleSelectPenalty(teamId, 'goal')}
                title="Penalty converted into a Goal!"
              >
                <span>⚽ Goal (PK)</span>
              </button>
              <button
                type="button"
                className="penalty-sub-btn pk-miss"
                onClick={() => handleSelectPenalty(teamId, 'missed')}
                title="Penalty missed or saved"
              >
                <span>❌ Missed</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`action-btn ${sideClass}`}
              onClick={() => {
                triggerHaptic(20);
                playTapSound();
                if (penaltyMenuTimer.current) clearTimeout(penaltyMenuTimer.current);
                setPenaltyMenuTeam(teamId);
                penaltyMenuTimer.current = setTimeout(() => {
                  setPenaltyMenuTeam(null);
                }, 5000);
              }}
              title={`Record Penalty for ${team.name}`}
              aria-label={`Penalty for ${team.name}`}
            >
              <div className="btn-icon">
                <CircleDot size={22} color="#f59e0b" />
              </div>
              <span className="btn-label">Penalty</span>
              <span className="btn-count-badge" title="Penalties (missed)">
                {stats.pkGoals > 0 ? `${stats.pkGoals}⚽` : stats.penalties > 0 ? `${stats.penalties}✗` : '0'}
              </span>
            </button>
          )}

          {/* 7. THROW-IN */}
          <button
            type="button"
            className={`action-btn ${sideClass}`}
            onClick={() => handleAction(teamId, 'THROW_IN')}
            title={`Record Throw-in for ${team.name}`}
            aria-label={`Throw-in for ${team.name}`}
          >
            <div className="btn-icon">
              <ArrowUpRight size={22} color="#94a3b8" />
            </div>
            <span className="btn-label">Throw-in</span>
            <span className="btn-count-badge" title="Throw-ins taken">
              {stats.throwIns}
            </span>
          </button>

          {/* 8. SUBSTITUTION */}
          <button
            type="button"
            className={`action-btn ${sideClass}`}
            onClick={() => handleAction(teamId, 'SUBSTITUTION')}
            title={`Record Substitution for ${team.name}`}
            aria-label={`Substitution for ${team.name}`}
          >
            <div className="btn-icon">
              <ArrowLeftRight size={22} color="#a855f7" />
            </div>
            <span className="btn-label">Substitution</span>
            <span className="btn-count-badge" title="Substitutions made">
              {stats.substitutions}
            </span>
          </button>

          {/* 9. OFFSIDE */}
          <button
            type="button"
            className={`action-btn ${sideClass}`}
            onClick={() => handleAction(teamId, 'OFFSIDE')}
            title={`Record Offside for ${team.name}`}
            aria-label={`Offside for ${team.name}`}
          >
            <div className="btn-icon">
              <span style={{ fontSize: '20px', lineHeight: 1 }} role="img" aria-label="Offside flag">🚩</span>
            </div>
            <span className="btn-label">Offside</span>
            <span className="btn-count-badge" title="Offsides">
              {stats.offsides}
            </span>
          </button>
        </div>
      </section>
    );
  };

  const leftTeamId: TeamId = swappedSides ? 'away' : 'home';
  const rightTeamId: TeamId = swappedSides ? 'home' : 'away';

  return (
    <div className="split-screen-grid">
      {renderTeamColumn(leftTeamId)}
      {renderTeamColumn(rightTeamId)}
    </div>
  );
};
