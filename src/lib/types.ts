export type TeamId = 'home' | 'away';

export type EventType =
  | 'GOAL'
  | 'SHOT_ON_TARGET'
  | 'SHOT'
  | 'GREAT_SAVE'
  | 'FOUL'
  | 'CORNER_KICK'
  | 'PENALTY'
  | 'OFFSIDE'
  | 'THROW_IN'
  | 'SUBSTITUTION';

export type MatchPhase =
  | 'NOT_STARTED'
  | 'FIRST_HALF'
  | 'HALF_TIME'
  | 'SECOND_HALF'
  | 'EXTRA_TIME_1'
  | 'EXTRA_TIME_HT'
  | 'EXTRA_TIME_2'
  | 'FULL_TIME';

export interface ClockState {
  phase: MatchPhase;
  elapsedSeconds: number; // accumulated running seconds
  isRunning: boolean;
  lastStartedRealTime: number | null; // Date.now() timestamp when timer was last started
}

export interface TeamInfo {
  id: TeamId;
  name: string;
  shortName: string;
  color: string;
  score: number;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: TeamId;
  eventType: EventType;
  matchTimeSeconds: number;
  matchTimeFormatted: string;
  phase: MatchPhase;
  realTimestamp: string; // ISO 8601 string
  details?: {
    player?: string;
    subIn?: string;
    subOut?: string;
    notes?: string;
    card?: 'yellow' | 'red';
    pk?: boolean;      // true when GOAL was scored from a penalty kick
    missed?: boolean;  // true when PENALTY event represents a missed PK
  };
}

export interface Match {
  id: string;
  createdAt: string;
  updatedAt: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  clock: ClockState;
  halfDurationMinutes?: number; // Configurable half duration, default 30
  notes?: string;
}

export interface TeamStats {
  goals: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  totalShots: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  corners: number;
  penalties: number;     // missed penalties
  pkGoals: number;       // goals scored from PK
  offsides: number;
  throwIns: number;
  substitutions: number;
  greatSaves?: number;
}

export interface MatchExportPayload {
  trackerVersion: string;
  exportedAt: string;
  match: {
    id: string;
    createdAt: string;
    phase: MatchPhase;
    finalMatchTime: string;
    teams: {
      home: {
        name: string;
        score: number;
        color: string;
      };
      away: {
        name: string;
        score: number;
        color: string;
      };
    };
  };
  summary: {
    home: TeamStats;
    away: TeamStats;
  };
  events: MatchEvent[];
}
