import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

type Stats = { gpt: number; banana: number; tie: number; skip: number };

const EMPTY: Stats = { gpt: 0, banana: 0, tie: 0, skip: 0 };
const CATEGORIES = ['fotogercekcilik', 'yazi', 'tasarim', 'karakter', 'superguc', 'elyazisi'];
const MATCHUP_IDS = Array.from({ length: 20 }, (_, i) => i + 1);

export default async (_req: Request, _context: Context) => {
  const store = getStore({ name: 'votes', consistency: 'strong' });

  // Read all keys in parallel
  const [totalsRaw, catEntries, mEntries] = await Promise.all([
    store.get('totals', { type: 'json' }).catch(() => null),
    Promise.all(
      CATEGORIES.map(async (c) => {
        const v = (await store.get(`c/${c}`, { type: 'json' }).catch(() => null)) as Stats | null;
        return [c, v ?? { ...EMPTY }] as const;
      })
    ),
    Promise.all(
      MATCHUP_IDS.map(async (id) => {
        const v = (await store.get(`m/${id}`, { type: 'json' }).catch(() => null)) as Stats | null;
        return [String(id), v ?? { ...EMPTY }] as const;
      })
    ),
  ]);

  const totals: Stats = (totalsRaw as Stats | null) ?? { ...EMPTY };
  const byCategory = Object.fromEntries(catEntries) as Record<string, Stats>;
  const byMatchup = Object.fromEntries(mEntries) as Record<string, Stats>;
  const totalVotes = totals.gpt + totals.banana + totals.tie + totals.skip;

  return new Response(
    JSON.stringify({ totals, byCategory, byMatchup, totalVotes }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30',
      },
    }
  );
};

export const config = {
  path: '/.netlify/functions/leaderboard',
};
