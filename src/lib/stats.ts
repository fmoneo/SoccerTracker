import { Match, MatchEvent, MatchExportPayload, TeamId, TeamStats } from './types';
import { formatEventMatchTime } from './clock';

export function calculateTeamStats(events: MatchEvent[], teamId: TeamId): TeamStats {
  const teamEvents = events.filter((e) => e.teamId === teamId);

  let goals = 0;
  let shotsOnTarget = 0;
  let shotsOffTarget = 0;
  let fouls = 0;
  let yellowCards = 0;
  let redCards = 0;
  let corners = 0;
  let penalties = 0;
  let pkGoals = 0;
  let offsides = 0;
  let throwIns = 0;
  let substitutions = 0;
  let greatSaves = 0;

  for (const event of teamEvents) {
    switch (event.eventType) {
      case 'GOAL':
        goals += 1;
        shotsOnTarget += 1;
        if (event.details?.pk) pkGoals += 1;
        break;
      case 'SHOT_ON_TARGET':
        shotsOnTarget += 1;
        break;
      case 'SHOT':
        shotsOffTarget += 1;
        break;
      case 'GREAT_SAVE':
        greatSaves += 1;
        break;
      case 'FOUL':
        fouls += 1;
        if (event.details?.card === 'yellow') yellowCards += 1;
        if (event.details?.card === 'red') redCards += 1;
        break;
      case 'CORNER_KICK':
        corners += 1;
        break;
      case 'PENALTY':
        penalties += 1;
        break;
      case 'OFFSIDE':
        offsides += 1;
        break;
      case 'THROW_IN':
        throwIns += 1;
        break;
      case 'SUBSTITUTION':
        substitutions += 1;
        break;
    }
  }

  return {
    goals,
    shotsOnTarget,
    shotsOffTarget,
    totalShots: shotsOnTarget + shotsOffTarget,
    fouls,
    yellowCards,
    redCards,
    corners,
    penalties,
    pkGoals,
    offsides,
    throwIns,
    substitutions,
    greatSaves,
  };
}

export function buildExportPayload(match: Match, events: MatchEvent[]): MatchExportPayload {
  const homeStats = calculateTeamStats(events, 'home');
  const awayStats = calculateTeamStats(events, 'away');

  return {
    trackerVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    match: {
      id: match.id,
      createdAt: match.createdAt,
      phase: match.clock.phase,
      finalMatchTime: formatEventMatchTime(match.clock),
      teams: {
        home: {
          name: match.homeTeam.name,
          score: homeStats.goals,
          color: match.homeTeam.color,
        },
        away: {
          name: match.awayTeam.name,
          score: awayStats.goals,
          color: match.awayTeam.color,
        },
      },
    },
    summary: {
      home: homeStats,
      away: awayStats,
    },
    events: events.map((e) => ({
      ...e,
      teamName: e.teamId === 'home' ? match.homeTeam.name : match.awayTeam.name,
    })),
  };
}
