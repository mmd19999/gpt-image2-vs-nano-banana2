import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

type Choice = 'gpt' | 'banana' | 'tie' | 'skip';
type Stats = { gpt: number; banana: number; tie: number; skip: number };

const VALID_CHOICES: Choice[] = ['gpt', 'banana', 'tie', 'skip'];
const VALID_MATCHUP_IDS = new Set(Array.from({ length: 20 }, (_, i) => i + 1));

// Categories map — keep in sync with /src/data/matchups.ts
const MATCHUP_CATEGORY: Record<number, string> = {
  1: 'fotogercekcilik', 2: 'fotogercekcilik', 3: 'fotogercekcilik', 4: 'fotogercekcilik',
  5: 'yazi', 6: 'yazi', 7: 'yazi',
  8: 'tasarim', 9: 'tasarim', 19: 'tasarim', 20: 'tasarim',
  10: 'karakter', 11: 'karakter', 12: 'karakter', 13: 'karakter',
  14: 'superguc', 15: 'superguc',
  16: 'elyazisi', 17: 'elyazisi', 18: 'elyazisi',
};

const RATE_LIMIT_MAX = 25; // votes per hour per IP
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function hashIp(ip: string): string {
  // Stable simple hash, not cryptographic. Goal: anonymize-ish rate-limit key.
  let h = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    h ^= ip.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const nfIp = req.headers.get('x-nf-client-connection-ip');
  if (nfIp) return nfIp;
  return 'unknown';
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Geçersiz JSON' }, 400);
  }

  const matchupId = Number(body?.matchupId);
  const choice = body?.choice as Choice;
  const sessionId = String(body?.sessionId ?? '').slice(0, 128);

  if (!VALID_MATCHUP_IDS.has(matchupId)) {
    return jsonResponse({ error: 'Geçersiz matchup' }, 400);
  }
  if (!VALID_CHOICES.includes(choice)) {
    return jsonResponse({ error: 'Geçersiz seçim' }, 400);
  }
  if (!sessionId || sessionId.length < 8) {
    return jsonResponse({ error: 'Session gerekli' }, 400);
  }

  const votesStore = getStore({ name: 'votes', consistency: 'strong' });
  const sessionStore = getStore({ name: 'sessions', consistency: 'strong' });
  const rateStore = getStore({ name: 'ratelimit', consistency: 'strong' });

  // Session-based dedup: one vote per (session, matchup)
  const sessionKey = `${sessionId}/${matchupId}`;
  const existing = await sessionStore.get(sessionKey);
  if (existing) {
    return jsonResponse({ error: 'Bu matchup için zaten oy kullandın' }, 409);
  }

  // Rate limit by IP hash
  const ipKey = hashIp(clientIp(req));
  const now = Date.now();
  const rateRaw = await rateStore.get(ipKey, { type: 'json' }).catch(() => null) as
    | { windowStart: number; count: number }
    | null;
  let windowStart = rateRaw?.windowStart ?? now;
  let count = rateRaw?.count ?? 0;
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  if (count >= RATE_LIMIT_MAX) {
    return jsonResponse({ error: 'Çok fazla oy gönderdin, biraz dinlen.' }, 429);
  }

  // Commit session marker first (prevents double-submit race)
  await sessionStore.set(sessionKey, JSON.stringify({ choice, ts: now }));

  // Increment matchup counter
  const matchupKey = `m/${matchupId}`;
  const matchupRaw = (await votesStore.get(matchupKey, { type: 'json' }).catch(() => null)) as Stats | null;
  const stats: Stats = matchupRaw ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
  stats[choice]++;
  await votesStore.setJSON(matchupKey, stats);

  // Increment category counter
  const cat = MATCHUP_CATEGORY[matchupId];
  if (cat) {
    const catKey = `c/${cat}`;
    const catRaw = (await votesStore.get(catKey, { type: 'json' }).catch(() => null)) as Stats | null;
    const catStats: Stats = catRaw ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
    catStats[choice]++;
    await votesStore.setJSON(catKey, catStats);
  }

  // Increment global counter
  const totRaw = (await votesStore.get('totals', { type: 'json' }).catch(() => null)) as Stats | null;
  const tot: Stats = totRaw ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
  tot[choice]++;
  await votesStore.setJSON('totals', tot);

  // Update rate limit
  await rateStore.setJSON(ipKey, { windowStart, count: count + 1 });

  return jsonResponse({ ok: true, stats });
};

export const config = {
  path: '/.netlify/functions/vote',
};
