'use client';

import React from 'react';
import { Play, Pause, FastForward, Flag } from 'lucide-react';
import { ClockState, MatchPhase } from '../lib/types';
import {
  getClockDisplay,
  calculateCurrentElapsedSeconds,
  getRegulationHalfSeconds,
  getRegulationFullSeconds,
  DEFAULT_HALF_MINUTES,
} from '../lib/clock';
import { playWhistleSound, triggerHaptic } from '../lib/sound';

interface MatchClockProps {
  clock: ClockState;
  halfMinutes?: number;
  onUpdateClock: (updatedClock: ClockState) => void;
  onChangeHalfMinutes?: (halfMinutes: number) => void;
}

const PHASES: { key: MatchPhase; label: string }[] = [
  { key: 'NOT_STARTED', label: 'Pre' },
  { key: 'FIRST_HALF', label: '1st Half' },
  { key: 'HALF_TIME', label: 'HT' },
  { key: 'SECOND_HALF', label: '2nd Half' },
  { key: 'FULL_TIME', label: 'FT' },
];

const HALF_OPTIONS = [20, 25, 30, 35, 40, 45];

export const MatchClock: React.FC<MatchClockProps> = ({
  clock,
  halfMinutes = DEFAULT_HALF_MINUTES,
  onUpdateClock,
  onChangeHalfMinutes,
}) => {
  const [, setTick] = React.useState(0);

  // High-frequency tick for smooth clock updates when running
  React.useEffect(() => {
    if (!clock.isRunning) return;

    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 10000);
    }, 200);

    return () => clearInterval(interval);
  }, [clock.isRunning]);

  const display = getClockDisplay(clock, halfMinutes);

  // Handle Start / Resume
  const handleStartResume = () => {
    triggerHaptic(30);
    playWhistleSound(false);

    if (clock.phase === 'NOT_STARTED') {
      onUpdateClock({
        phase: 'FIRST_HALF',
        elapsedSeconds: 0,
        isRunning: true,
        lastStartedRealTime: Date.now(),
      });
    } else if (clock.phase === 'HALF_TIME') {
      onUpdateClock({
        phase: 'SECOND_HALF',
        elapsedSeconds: getRegulationHalfSeconds(halfMinutes),
        isRunning: true,
        lastStartedRealTime: Date.now(),
      });
    } else {
      // Resume current half
      onUpdateClock({
        ...clock,
        isRunning: true,
        lastStartedRealTime: Date.now(),
      });
    }
  };

  // Handle Pause
  const handlePause = () => {
    triggerHaptic(20);
    const currentElapsed = calculateCurrentElapsedSeconds(clock);
    onUpdateClock({
      ...clock,
      isRunning: false,
      elapsedSeconds: currentElapsed,
      lastStartedRealTime: null,
    });
  };

  // Handle End 1st Half
  const handleEndFirstHalf = () => {
    triggerHaptic([30, 50, 30]);
    playWhistleSound(true);
    const currentElapsed = calculateCurrentElapsedSeconds(clock);
    const finalHalfElapsed = Math.max(getRegulationHalfSeconds(halfMinutes), currentElapsed);

    onUpdateClock({
      phase: 'HALF_TIME',
      isRunning: false,
      elapsedSeconds: finalHalfElapsed,
      lastStartedRealTime: null,
    });
  };

  // Handle Full Time (End Match)
  const handleFullTime = () => {
    triggerHaptic([40, 60, 40, 60, 40]);
    playWhistleSound(true);
    const currentElapsed = calculateCurrentElapsedSeconds(clock);
    const finalElapsed = Math.max(getRegulationFullSeconds(halfMinutes), currentElapsed);

    onUpdateClock({
      phase: 'FULL_TIME',
      isRunning: false,
      elapsedSeconds: finalElapsed,
      lastStartedRealTime: null,
    });
  };

  return (
    <div className="center-hud">
      {/* Phase progress ribbon + Configurable Half Duration Selector */}
      <div className="phase-ribbon" role="tablist" aria-label="Match Phases">
        {PHASES.map((p) => (
          <span
            key={p.key}
            className={`phase-pill ${clock.phase === p.key ? 'active' : ''}`}
          >
            {p.label}
          </span>
        ))}

        {/* Configurable Half Duration selector */}
        {onChangeHalfMinutes && clock.phase === 'NOT_STARTED' && (
          <label className="half-duration-selector" title="Configure Half Duration">
            <span className="half-duration-label">Half:</span>
            <select
              className="half-duration-select"
              value={halfMinutes}
              onChange={(e) => onChangeHalfMinutes(Number(e.target.value))}
            >
              {HALF_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}m
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Clock display */}
      <div className="clock-timer-container" aria-live="off" title="Match Clock">
        <span className="clock-digits">{display.mainDisplay}</span>
        {display.stoppageDisplay && (
          <span className="clock-stoppage">{display.stoppageDisplay}</span>
        )}
      </div>

      {/* Clock control buttons */}
      <div className="clock-controls-row">
        {clock.phase === 'NOT_STARTED' && (
          <button
            type="button"
            className="clock-action-btn start"
            onClick={handleStartResume}
          >
            <Play size={15} fill="currentColor" />
            <span>Start 1st Half</span>
          </button>
        )}

        {clock.phase === 'FIRST_HALF' && (
          <>
            {clock.isRunning ? (
              <button
                type="button"
                className="clock-action-btn pause"
                onClick={handlePause}
              >
                <Pause size={15} fill="currentColor" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                className="clock-action-btn start"
                onClick={handleStartResume}
              >
                <Play size={15} fill="currentColor" />
                <span>Resume</span>
              </button>
            )}

            <button
              type="button"
              className="clock-action-btn secondary"
              onClick={handleEndFirstHalf}
            >
              <FastForward size={15} />
              <span>End 1st Half</span>
            </button>
          </>
        )}

        {clock.phase === 'HALF_TIME' && (
          <button
            type="button"
            className="clock-action-btn start"
            onClick={handleStartResume}
          >
            <Play size={15} fill="currentColor" />
            <span>Start 2nd Half</span>
          </button>
        )}

        {clock.phase === 'SECOND_HALF' && (
          <>
            {clock.isRunning ? (
              <button
                type="button"
                className="clock-action-btn pause"
                onClick={handlePause}
              >
                <Pause size={15} fill="currentColor" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                className="clock-action-btn start"
                onClick={handleStartResume}
              >
                <Play size={15} fill="currentColor" />
                <span>Resume</span>
              </button>
            )}

            <button
              type="button"
              className="clock-action-btn secondary"
              onClick={handleFullTime}
            >
              <Flag size={15} />
              <span>Full Time</span>
            </button>
          </>
        )}

        {clock.phase === 'FULL_TIME' && (
          <div className="phase-pill active">
            <span>Match Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};
