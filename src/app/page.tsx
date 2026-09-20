'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Match, MatchEvent, TeamId, EventType, ClockState } from '../lib/types';
import {
  getCurrentMatch,
  saveMatch,
  addEvent,
  getMatchEvents,
  deleteEvent,
  openDB,
} from '../lib/db';
import {
  formatEventMatchTime,
  calculateCurrentElapsedSeconds,
} from '../lib/clock';
import { Header } from '../components/Header';
import { Scoreboard } from '../components/Scoreboard';
import { SplitActionBoard } from '../components/SplitActionBoard';
import { TimelineLog } from '../components/TimelineLog';
import { ExportModal } from '../components/ExportModal';
import { SubModal } from '../components/SubModal';
import { QuickPlayerModal } from '../components/QuickPlayerModal';

function createDefaultMatch(): Match {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `match_${Date.now()}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    homeTeam: {
      id: 'home',
      name: 'Rayados NW',
      shortName: 'RAY',
      color: '#06b6d4',
      score: 0,
    },
    awayTeam: {
      id: 'away',
      name: 'Legend FC',
      shortName: 'LEG',
      color: '#f43f5e',
      score: 0,
    },
    clock: {
      phase: 'NOT_STARTED',
      elapsedSeconds: 0,
      isRunning: false,
      lastStartedRealTime: null,
    },
    halfDurationMinutes: 30,
  };
}

export default function SoccerTrackerApp() {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Pitch management toggles
  const [swappedSides, setSwappedSides] = useState(false);
  const [tagPlayerMode, setTagPlayerMode] = useState(true);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [subTargetTeam, setSubTargetTeam] = useState<TeamId | null>(null);
  const [playerTagTarget, setPlayerTagTarget] = useState<{
    teamId: TeamId;
    eventType: EventType;
    details?: MatchEvent['details'];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2600);
  }, []);

  // Initialize DB and load saved match data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await openDB();
        const savedMatch = await getCurrentMatch();

        if (savedMatch) {
          let needsUpdate = false;
          // Upgrade default names if previously created
          if (savedMatch.homeTeam.name === 'Home FC') {
            savedMatch.homeTeam.name = 'Rayados NW';
            needsUpdate = true;
          }
          if (savedMatch.awayTeam.name === 'Away United') {
            savedMatch.awayTeam.name = 'Legend FC';
            needsUpdate = true;
          }
          if (!savedMatch.halfDurationMinutes) {
            savedMatch.halfDurationMinutes = 30;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await saveMatch(savedMatch);
          }

          if (isMounted) {
            setMatch(savedMatch);
            const savedEvents = await getMatchEvents(savedMatch.id);
            if (isMounted) setEvents(savedEvents);
          }
        } else {
          const fresh = createDefaultMatch();
          await saveMatch(fresh);
          if (isMounted) {
            setMatch(fresh);
            setEvents([]);
          }
        }
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update match in state and persist to IndexedDB
  const handleUpdateClock = useCallback(async (updatedClock: ClockState) => {
    if (!match) return;
    const updatedMatch: Match = {
      ...match,
      clock: updatedClock,
    };
    setMatch(updatedMatch);
    await saveMatch(updatedMatch);
  }, [match]);

  const handleChangeHalfMinutes = useCallback(async (minutes: number) => {
    if (!match) return;
    const updatedMatch: Match = {
      ...match,
      halfDurationMinutes: minutes,
    };
    setMatch(updatedMatch);
    await saveMatch(updatedMatch);
    showToast(`Half duration set to ${minutes} mins`);
  }, [match, showToast]);

  const handleUpdateTeamName = useCallback(async (side: 'home' | 'away', name: string) => {
    if (!match) return;
    const updatedMatch: Match = {
      ...match,
      [side === 'home' ? 'homeTeam' : 'awayTeam']: {
        ...(side === 'home' ? match.homeTeam : match.awayTeam),
        name,
      },
    };
    setMatch(updatedMatch);
    await saveMatch(updatedMatch);
  }, [match]);

  // Trigger match event - instantly write to IndexedDB!
  const handleTriggerEvent = useCallback(
    async (teamId: TeamId, eventType: EventType, details?: MatchEvent['details']) => {
      if (!match) return;

      const currentElapsed = calculateCurrentElapsedSeconds(match.clock);
      const formattedTime = formatEventMatchTime(match.clock, match.halfDurationMinutes || 30);
      const eventId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newEvent: MatchEvent = {
        id: eventId,
        matchId: match.id,
        teamId,
        eventType,
        matchTimeSeconds: currentElapsed,
        matchTimeFormatted: formattedTime,
        phase: match.clock.phase,
        realTimestamp: new Date().toISOString(),
        details,
      };

      // 1. Instantly write event to IndexedDB
      await addEvent(newEvent);

      // 2. Update local state
      const nextEvents = [...events, newEvent];
      setEvents(nextEvents);

      // 3. If Goal, update score in match record as well
      if (eventType === 'GOAL') {
        const isHome = teamId === 'home';
        const updatedMatch: Match = {
          ...match,
          homeTeam: {
            ...match.homeTeam,
            score: isHome ? match.homeTeam.score + 1 : match.homeTeam.score,
          },
          awayTeam: {
            ...match.awayTeam,
            score: !isHome ? match.awayTeam.score + 1 : match.awayTeam.score,
          },
        };
        setMatch(updatedMatch);
        await saveMatch(updatedMatch);
      }
    },
    [match, events]
  );

  // Handle Undo (delete latest event from IDB)
  const handleUndo = useCallback(async () => {
    if (events.length === 0 || !match) return;
    const lastEvent = events[events.length - 1];

    // Delete from IndexedDB
    await deleteEvent(lastEvent.id);

    // Update state
    const nextEvents = events.slice(0, -1);
    setEvents(nextEvents);

    // If undone event was a goal, decrement score
    if (lastEvent.eventType === 'GOAL') {
      const isHome = lastEvent.teamId === 'home';
      const updatedMatch: Match = {
        ...match,
        homeTeam: {
          ...match.homeTeam,
          score: isHome ? Math.max(0, match.homeTeam.score - 1) : match.homeTeam.score,
        },
        awayTeam: {
          ...match.awayTeam,
          score: !isHome ? Math.max(0, match.awayTeam.score - 1) : match.awayTeam.score,
        },
      };
      setMatch(updatedMatch);
      await saveMatch(updatedMatch);
    }

    showToast(`Undid ${lastEvent.eventType}`);
  }, [events, match, showToast]);

  // Handle individual event delete from timeline
  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      const target = events.find((e) => e.id === eventId);
      if (!target || !match) return;

      await deleteEvent(eventId);
      const nextEvents = events.filter((e) => e.id !== eventId);
      setEvents(nextEvents);

      if (target.eventType === 'GOAL') {
        const isHome = target.teamId === 'home';
        const updatedMatch: Match = {
          ...match,
          homeTeam: {
            ...match.homeTeam,
            score: isHome ? Math.max(0, match.homeTeam.score - 1) : match.homeTeam.score,
          },
          awayTeam: {
            ...match.awayTeam,
            score: !isHome ? Math.max(0, match.awayTeam.score - 1) : match.awayTeam.score,
          },
        };
        setMatch(updatedMatch);
        await saveMatch(updatedMatch);
      }

      showToast('Event removed');
    },
    [events, match, showToast]
  );

  // Handle New Match
  const handleNewMatch = useCallback(async () => {
    const confirmStart = window.confirm(
      'Start a new match session? Your previous match will be saved in archive and a clean match will begin.'
    );
    if (!confirmStart) return;

    const fresh = createDefaultMatch();
    await saveMatch(fresh);
    setMatch(fresh);
    setEvents([]);
    showToast('New match session started!');
  }, [showToast]);

  // Handle Substitution submission
  const handleSubmitSub = useCallback(
    (teamId: TeamId, subIn: string, subOut: string) => {
      handleTriggerEvent(teamId, 'SUBSTITUTION', { subIn, subOut });
      showToast(`Sub recorded: In: ${subIn}, Out: ${subOut}`);
    },
    [handleTriggerEvent, showToast]
  );

  // Handle Player Tagging confirmation
  const handleConfirmPlayerTag = useCallback(
    (playerNumber: string) => {
      if (!playerTagTarget) return;
      const details = playerNumber ? { player: playerNumber } : undefined;
      handleTriggerEvent(playerTagTarget.teamId, playerTagTarget.eventType, details);
      setPlayerTagTarget(null);
    },
    [playerTagTarget, handleTriggerEvent]
  );

  if (loading || !match) {
    return (
      <main className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Loading IndexedDB Match Tracker...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="app-container">
      {/* 1. Header with IDB status, undo, sound, export */}
      <Header
        eventCount={events.length}
        canUndo={events.length > 0}
        onUndo={handleUndo}
        onNewMatch={handleNewMatch}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* 2. Scoreboard and Match Clock Central HUD (Sticky) */}
      <Scoreboard
        match={match}
        events={events}
        swappedSides={swappedSides}
        tagPlayerMode={tagPlayerMode}
        onToggleSides={() => setSwappedSides((prev) => !prev)}
        onToggleTagPlayer={() => setTagPlayerMode((prev) => !prev)}
        onUpdateTeamName={handleUpdateTeamName}
        onUpdateClock={handleUpdateClock}
        onChangeHalfMinutes={handleChangeHalfMinutes}
      />

      {/* 3. Split-Screen Action Board with Large Touch Buttons */}
      <SplitActionBoard
        match={match}
        events={events}
        swappedSides={swappedSides}
        tagPlayerMode={tagPlayerMode}
        onTriggerEvent={handleTriggerEvent}
        onRequestSub={(side) => setSubTargetTeam(side)}
        onRequestPlayerTag={(teamId, eventType) => setPlayerTagTarget({ teamId, eventType })}
      />

      {/* 4. Live Event Timeline with Quick Undo */}
      <TimelineLog
        match={match}
        events={events}
        canUndo={events.length > 0}
        onUndo={handleUndo}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* 5. Export & Share Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        match={match}
        events={events}
        onShowToast={showToast}
      />

      {/* 6. Substitution Modal */}
      <SubModal
        isOpen={subTargetTeam !== null}
        teamId={subTargetTeam}
        teamName={subTargetTeam === 'home' ? match.homeTeam.name : match.awayTeam.name}
        onClose={() => setSubTargetTeam(null)}
        onSubmitSub={handleSubmitSub}
      />

      {/* 7. Quick Player Jersey Tag Modal */}
      <QuickPlayerModal
        isOpen={playerTagTarget !== null}
        teamId={playerTagTarget?.teamId ?? null}
        teamName={
          playerTagTarget?.teamId === 'home' ? match.homeTeam.name : match.awayTeam.name
        }
        eventType={playerTagTarget?.eventType ?? null}
        onClose={() => setPlayerTagTarget(null)}
        onConfirm={handleConfirmPlayerTag}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
