import type { LeaderboardData, VoteChoice } from '../types';
import { getSessionId } from './session';

const BASE = '/.netlify/functions';

export async function fetchLeaderboard(): Promise<LeaderboardData> {
  const res = await fetch(`${BASE}/leaderboard`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Leaderboard yüklenemedi');
  return res.json();
}

export async function submitVote(matchupId: number, choice: VoteChoice): Promise<{
  ok: boolean;
  stats?: { gpt: number; banana: number; tie: number; skip: number };
  error?: string;
}> {
  const res = await fetch(`${BASE}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchupId,
      choice,
      sessionId: getSessionId(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error || 'Oy gönderilemedi' };
  }
  return { ok: true, stats: data.stats };
}
