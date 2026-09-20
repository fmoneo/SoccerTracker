import { ClockState, MatchPhase } from './types';

export const DEFAULT_HALF_MINUTES = 30;

export function getRegulationHalfSeconds(halfMinutes: number = DEFAULT_HALF_MINUTES): number {
  return halfMinutes * 60;
}

export function getRegulationFullSeconds(halfMinutes: number = DEFAULT_HALF_MINUTES): number {
  return halfMinutes * 2 * 60;
}

/**
 * Calculates accurate running match seconds factoring in real wall-clock delta.
 * This guarantees no drift occurs if device sleeps or page is refreshed.
 */
export function calculateCurrentElapsedSeconds(clock: ClockState): number {
  if (!clock.isRunning || !clock.lastStartedRealTime) {
    return clock.elapsedSeconds;
  }
  const deltaSeconds = Math.max(0, Math.floor((Date.now() - clock.lastStartedRealTime) / 1000));
  return clock.elapsedSeconds + deltaSeconds;
}

/**
 * Pads a number with leading zero
 */
function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Formats seconds into MM:SS
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${pad(mins)}:${pad(secs)}`;
}

export interface ClockDisplayInfo {
  mainDisplay: string;
  stoppageDisplay?: string;
  phaseLabel: string;
}

/**
 * Returns formatted clock representation for UI and event logs.
 * Handles stoppage time dynamically based on configured half duration (default 30m).
 */
export function getClockDisplay(
  clock: ClockState,
  halfMinutes: number = DEFAULT_HALF_MINUTES
): ClockDisplayInfo {
  const currentSeconds = calculateCurrentElapsedSeconds(clock);
  const halfSeconds = getRegulationHalfSeconds(halfMinutes);
  const fullSeconds = getRegulationFullSeconds(halfMinutes);
  const halfFormatted = formatMinutesSeconds(halfSeconds);
  const fullFormatted = formatMinutesSeconds(fullSeconds);

  switch (clock.phase) {
    case 'NOT_STARTED':
      return {
        mainDisplay: '00:00',
        phaseLabel: 'Pre-Match',
      };

    case 'FIRST_HALF': {
      if (currentSeconds > halfSeconds) {
        const extraSecs = currentSeconds - halfSeconds;
        return {
          mainDisplay: halfFormatted,
          stoppageDisplay: `+${formatMinutesSeconds(extraSecs)}`,
          phaseLabel: '1st Half Stoppage',
        };
      }
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: '1st Half',
      };
    }

    case 'HALF_TIME':
      return {
        mainDisplay: halfFormatted,
        phaseLabel: 'Half Time',
      };

    case 'SECOND_HALF': {
      if (currentSeconds > fullSeconds) {
        const extraSecs = currentSeconds - fullSeconds;
        return {
          mainDisplay: fullFormatted,
          stoppageDisplay: `+${formatMinutesSeconds(extraSecs)}`,
          phaseLabel: '2nd Half Stoppage',
        };
      }
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: '2nd Half',
      };
    }

    case 'EXTRA_TIME_1':
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: 'Extra Time (1st)',
      };

    case 'EXTRA_TIME_HT':
      return {
        mainDisplay: formatMinutesSeconds(fullSeconds + 10 * 60),
        phaseLabel: 'Extra Time HT',
      };

    case 'EXTRA_TIME_2':
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: 'Extra Time (2nd)',
      };

    case 'FULL_TIME':
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: 'Full Time',
      };

    default:
      return {
        mainDisplay: formatMinutesSeconds(currentSeconds),
        phaseLabel: 'Match Clock',
      };
  }
}

/**
 * Returns formatted string representing exact match time at moment of logging
 */
export function formatEventMatchTime(
  clock: ClockState,
  halfMinutes: number = DEFAULT_HALF_MINUTES
): string {
  const info = getClockDisplay(clock, halfMinutes);
  if (info.stoppageDisplay) {
    return `${info.mainDisplay} ${info.stoppageDisplay}`;
  }
  return info.mainDisplay;
}
