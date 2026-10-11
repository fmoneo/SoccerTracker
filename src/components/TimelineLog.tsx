'use client';

import React from 'react';
import { History, X, RotateCcw } from 'lucide-react';
import { Match, MatchEvent } from '../lib/types';
import { CornerFlagIcon, OffsideFlagIcon, GoalKickIcon } from './SoccerIcons';

interface TimelineLogProps {
  match: Match;
  events: MatchEvent[];
  canUndo: boolean;
  onUndo: () => void;
  onDeleteEvent: (eventId: string) => void;
}

const EVENT_LABELS: Record<string, string> = {
  GOAL: '⚽ Goal',
  SHOT_ON_TARGET: '🎯 Shot on Target',
  SHOT: '🚀 Shot (Off Target)',
  GREAT_SAVE: '🧤 Great Save',
  FOUL: '⚠️ Foul',
  CORNER_KICK: 'Corner Kick',
  GOAL_KICK: 'Goal Kick',
  PENALTY: '🥅 Penalty',
  OFFSIDE: 'Offside',
  THROW_IN: '🤾 Throw-in',
  SUBSTITUTION: '🔄 Sub',
  START_1ST_HALF: '⏱️ Start 1st Half',
  END_1ST_HALF: '⏸️ End 1st Half',
  START_2ND_HALF: '⏱️ Start 2nd Half (Restart)',
  FULL_TIME: '🏁 End of the Game',
  XAVI_HIGHLIGHT: '⭐ Xavi Highlight #11',
};

export const TimelineLog: React.FC<TimelineLogProps> = ({
  match,
  events,
  canUndo,
  onUndo,
  onDeleteEvent,
}) => {
  const reversed = [...events].reverse();

  return (
    <section className="timeline-card" aria-label="Live Event Timeline">
      <div className="timeline-header">
        <div className="timeline-title">
          <History size={18} />
          <span>Match Event Timeline</span>
          <span className="timeline-count-badge">{events.length} logged</span>
        </div>

        {/* Quick prominent undo right in the timeline header */}
        <button
          type="button"
          className="header-btn"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          onClick={onUndo}
          disabled={!canUndo}
          title="Quick undo last logged event"
          aria-label="Quick undo"
        >
          <RotateCcw size={14} />
          <span>Quick Undo</span>
        </button>
      </div>

      <div className="timeline-scroll">
        {reversed.length === 0 ? (
          <div className="timeline-empty-state">
            No match events recorded yet. Tap any action button above to start tracking!
          </div>
        ) : (
          reversed.map((event) => {
            const isNeutral = event.teamId === 'neutral';
            const isHome = event.teamId === 'home';
            const teamName = isNeutral
              ? 'Match Phase'
              : isHome
              ? match.homeTeam.name
              : match.awayTeam.name;

            let labelNode: React.ReactNode = EVENT_LABELS[event.eventType] || event.eventType;
            if (event.eventType === 'CORNER_KICK') {
              labelNode = (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <CornerFlagIcon size={14} color={isHome ? '#38bdf8' : '#fb7185'} />
                  <span>Corner Kick</span>
                </span>
              );
            } else if (event.eventType === 'GOAL_KICK') {
              labelNode = (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <GoalKickIcon size={14} color={isHome ? '#38bdf8' : '#fb7185'} />
                  <span>Goal Kick</span>
                </span>
              );
            } else if (event.eventType === 'OFFSIDE') {
              labelNode = (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <OffsideFlagIcon size={14} />
                  <span>Offside</span>
                </span>
              );
            } else if (event.eventType === 'GOAL' && event.details?.pk) {
              labelNode = '⚽ Goal (PK)';
            } else if (event.eventType === 'FOUL') {
              if (event.details?.card === 'yellow') labelNode = '🟨 Yellow Card';
              else if (event.details?.card === 'red') labelNode = '🟥 Red Card';
            } else if (event.eventType === 'PENALTY' && event.details?.missed) {
              labelNode = '❌ Missed Penalty';
            }

            const subDetail =
              event.details?.subIn && event.details?.subOut
                ? ` (${event.details.subIn} in, ${event.details.subOut} out)`
                : '';

            const chipClass = isNeutral ? 'phase-boundary' : isHome ? 'home' : 'away';

            return (
              <div
                key={event.id}
                className={`timeline-chip ${chipClass}`}
                title={`Logged at real-time ${event.realTimestamp}`}
              >
                <span className="timeline-chip-time">{event.matchTimeFormatted}</span>
                {event.details?.player && (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: isHome ? '#38bdf8' : '#fb7185',
                    }}
                  >
                    {event.details.player}
                  </span>
                )}
                <span className="timeline-chip-event">
                  {labelNode}
                  {!isNeutral && ` • ${teamName}`}
                  {subDetail}
                </span>
                <button
                  type="button"
                  className="timeline-chip-delete"
                  onClick={() => onDeleteEvent(event.id)}
                  title="Remove this event"
                  aria-label={`Remove event ${event.eventType}`}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
