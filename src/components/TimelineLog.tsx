'use client';

import React from 'react';
import { History, X, RotateCcw } from 'lucide-react';
import { Match, MatchEvent } from '../lib/types';

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
  CORNER_KICK: '🚩 Corner Kick',
  PENALTY: '🥅 Penalty',
  OFFSIDE: '🚩 Offside',
  THROW_IN: '🤾 Throw-in',
  SUBSTITUTION: '🔄 Sub',
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
            const isHome = event.teamId === 'home';
            const teamName = isHome ? match.homeTeam.name : match.awayTeam.name;
            let label = EVENT_LABELS[event.eventType] || event.eventType;
            if (event.eventType === 'GOAL' && event.details?.pk) label = '⚽ Goal (PK)';
            if (event.eventType === 'FOUL') {
              if (event.details?.card === 'yellow') label = '🟨 Yellow Card';
              else if (event.details?.card === 'red') label = '🟥 Red Card';
            }
            if (event.eventType === 'PENALTY' && event.details?.missed) label = '❌ Missed Penalty';
            const playerTag = event.details?.player ? ` ${event.details.player}` : '';
            const subDetail = event.details?.subIn && event.details?.subOut
              ? ` (${event.details.subIn} in, ${event.details.subOut} out)`
              : '';

            return (
              <div
                key={event.id}
                className={`timeline-chip ${isHome ? 'home' : 'away'}`}
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
                  {label} • {teamName}{subDetail}
                </span>
                <button
                  type="button"
                  className="timeline-chip-delete"
                  onClick={() => onDeleteEvent(event.id)}
                  title="Remove this event"
                  aria-label={`Remove event ${label} for ${teamName}`}
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
