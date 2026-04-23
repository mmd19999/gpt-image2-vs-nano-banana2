const SESSION_KEY = 'vote_session_v1';
const VOTES_KEY = 'my_votes_v1';
const POSITIONS_KEY = 'my_positions_v1';

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = genId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type LocalVote = {
  matchupId: number;
  choice: 'gpt' | 'banana' | 'tie' | 'skip';
  ts: number;
};

export function getLocalVotes(): LocalVote[] {
  try {
    return JSON.parse(localStorage.getItem(VOTES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalVote(vote: LocalVote) {
  const existing = getLocalVotes().filter((v) => v.matchupId !== vote.matchupId);
  existing.push(vote);
  localStorage.setItem(VOTES_KEY, JSON.stringify(existing));
}

export function hasVotedLocal(matchupId: number): boolean {
  return getLocalVotes().some((v) => v.matchupId === matchupId);
}

export function resetVotes() {
  localStorage.removeItem(VOTES_KEY);
  localStorage.removeItem(POSITIONS_KEY);
}

export function getMatchupPosition(matchupId: number): 'gpt-left' | 'banana-left' {
  try {
    const positions: Record<number, 'gpt-left' | 'banana-left'> = JSON.parse(
      localStorage.getItem(POSITIONS_KEY) || '{}'
    );
    if (positions[matchupId]) return positions[matchupId];
    const pick: 'gpt-left' | 'banana-left' = Math.random() < 0.5 ? 'gpt-left' : 'banana-left';
    positions[matchupId] = pick;
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
    return pick;
  } catch {
    return Math.random() < 0.5 ? 'gpt-left' : 'banana-left';
  }
}
