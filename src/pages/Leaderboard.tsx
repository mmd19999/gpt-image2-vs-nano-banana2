import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MATCHUPS, CATEGORY_LABELS, CATEGORY_COLORS } from '../data/matchups';
import type { LeaderboardData, Category } from '../types';
import { fetchLeaderboard } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import ScoreBar from '../components/ScoreBar';

const CATEGORIES: Category[] = ['fotogercekcilik', 'yazi', 'tasarim', 'karakter', 'superguc', 'elyazisi'];

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{display.toLocaleString('tr-TR')}</span>;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const empty = !loading && (!data || data.totalVotes === 0);
  const totals = data?.totals ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
  const totalDecisive = totals.gpt + totals.banana;
  const gptPct = totalDecisive ? Math.round((totals.gpt / totalDecisive) * 100) : 50;
  const bananaPct = 100 - gptPct;
  const leader = totals.gpt === totals.banana ? null : totals.gpt > totals.banana ? 'gpt' : 'banana';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      {/* Hero */}
      <section className="text-center mb-10 sm:mb-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-400 mb-5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-win animate-pulse" />
          20 MATCHUP · AÇIK KARŞILAŞTIRMA · CANLI SONUÇLAR
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-4">
          <span className="gradient-text">GPT Image 2</span>
          <span className="text-gray-500 mx-2 sm:mx-3 font-light">vs</span>
          <span className="gradient-text">Nano Banana 2</span>
        </h1>
        <p className="max-w-xl mx-auto text-gray-400 text-sm sm:text-base">
          20 farklı promptta iki modelin çıktılarını karşılaştır ve oyunu kullan. Her oy canlı leaderboard'a yansır.
        </p>

        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <Link to="/oyla" className="btn-primary">
            Oylamaya Başla →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=coyM9hUlgdg"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            title="YouTube'da karşılaştırma videosunu izle"
          >
            YouTube Videosu
          </a>
        </div>
      </section>

      {/* Overall score */}
      <section className="glass rounded-2xl p-5 sm:p-8 mb-8">
        {empty ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🗳️</div>
            <h2 className="text-xl font-bold mb-2">Henüz oy yok</h2>
            <p className="text-gray-400 text-sm mb-5">İlk oylayan sen ol, topluluğun mahsup'unu sen başlat.</p>
            <Link to="/oyla" className="btn-primary">
              İlk Oyu Kullan →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Genel Skor</div>
                <div className="text-sm text-gray-400">
                  Toplam <span className="text-white font-semibold">
                    <AnimatedNumber value={data?.totalVotes ?? 0} />
                  </span>{' '}
                  oy
                </div>
              </div>
              {leader && (
                <div className="text-xs sm:text-sm">
                  <span className="text-gray-500">Önde:</span>{' '}
                  <span className={leader === 'gpt' ? 'text-gpt-soft font-bold' : 'text-banana-soft font-bold'}>
                    {leader === 'gpt' ? 'GPT Image 2' : 'Nano Banana 2'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="relative rounded-xl p-5 bg-gradient-to-br from-gpt/15 to-gpt/5 border border-gpt/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gpt" />
                    <span className="font-bold text-gpt-soft">GPT Image 2</span>
                  </div>
                  <span className="text-3xl font-black text-gpt-soft">{gptPct}%</span>
                </div>
                <div className="text-xs text-gray-400">
                  <AnimatedNumber value={totals.gpt} /> oy
                </div>
              </div>
              <div className="relative rounded-xl p-5 bg-gradient-to-br from-banana/15 to-banana/5 border border-banana/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-banana" />
                    <span className="font-bold text-banana-soft">Nano Banana 2</span>
                  </div>
                  <span className="text-3xl font-black text-banana-soft">{bananaPct}%</span>
                </div>
                <div className="text-xs text-gray-400">
                  <AnimatedNumber value={totals.banana} /> oy
                </div>
              </div>
            </div>

            <ScoreBar gpt={totals.gpt} banana={totals.banana} height="h-4" />
          </>
        )}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {error}. Netlify Functions'ın ayakta olduğundan emin ol.
          </div>
        )}
      </section>

      {/* Category table */}
      {!empty && data && (
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 px-1">Kategori Dağılımı</h2>
          <CategoryTable data={data} />
        </section>
      )}

      {/* Matchups with tabs */}
      <MatchupsSection data={data} />

      <div className="text-center mt-14">
        <Link to="/oyla" className="btn-primary">
          Oylamaya Başla →
        </Link>
        <div className="mt-3 text-xs text-gray-500">20 matchup · ~2 dakika</div>
      </div>

    </div>
  );
}

/* ---------- Category Table ---------- */

function CategoryTable({ data }: { data: LeaderboardData }) {
  const rows = CATEGORIES.map((cat) => {
    const s = data.byCategory[cat] ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
    const total = s.gpt + s.banana;
    const gPct = total ? Math.round((s.gpt / total) * 100) : 0;
    const bPct = total ? 100 - gPct : 0;
    const winner: 'gpt' | 'banana' | 'draw' | null =
      total === 0 ? null : s.gpt === s.banana ? 'draw' : s.gpt > s.banana ? 'gpt' : 'banana';
    return { cat, s, total, gPct, bPct, winner };
  });

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 bg-white/[0.02]">
              <th className="text-left px-5 py-3 font-medium">Kategori</th>
              <th className="text-right px-3 py-3 font-medium text-gpt-soft">GPT Image 2</th>
              <th className="text-center px-3 py-3 font-medium w-[30%]">Dağılım</th>
              <th className="text-left px-3 py-3 font-medium text-banana-soft">Nano Banana 2</th>
              <th className="text-right px-5 py-3 font-medium">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat, s, total, gPct, bPct, winner }) => (
              <tr key={cat} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <CategoryBadge category={cat} size="sm" />
                </td>
                <td className="text-right px-3 py-3 font-mono tabular-nums">
                  <div className={`font-bold ${winner === 'gpt' ? 'text-gpt-soft' : 'text-gray-300'}`}>
                    {gPct}%
                  </div>
                  <div className="text-[11px] text-gray-500">{s.gpt} oy</div>
                </td>
                <td className="px-3 py-3 min-w-[160px]">
                  {total === 0 ? (
                    <div className="text-center text-[11px] text-gray-600">—</div>
                  ) : (
                    <ScoreBar gpt={s.gpt} banana={s.banana} height="h-1.5" />
                  )}
                </td>
                <td className="text-left px-3 py-3 font-mono tabular-nums">
                  <div className={`font-bold ${winner === 'banana' ? 'text-banana-soft' : 'text-gray-300'}`}>
                    {bPct}%
                  </div>
                  <div className="text-[11px] text-gray-500">{s.banana} oy</div>
                </td>
                <td className="text-right px-5 py-3 text-gray-400 tabular-nums">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked list */}
      <div className="sm:hidden divide-y divide-white/5">
        {rows.map(({ cat, s, total, gPct, bPct, winner }) => (
          <div key={cat} className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <CategoryBadge category={cat} size="sm" />
              <span className="text-[11px] text-gray-500">{total} oy</span>
            </div>
            {total === 0 ? (
              <div className="text-xs text-gray-600">Henüz oy yok</div>
            ) : (
              <>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className={winner === 'gpt' ? 'text-gpt-soft' : 'text-gray-300'}>GPT {gPct}% ({s.gpt})</span>
                  <span className={winner === 'banana' ? 'text-banana-soft' : 'text-gray-300'}>({s.banana}) {bPct}% Banana</span>
                </div>
                <ScoreBar gpt={s.gpt} banana={s.banana} height="h-1.5" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Matchups with tabs ---------- */

type Tab = 'grid' | 'table';

function MatchupsSection({ data }: { data: LeaderboardData | null }) {
  const [tab, setTab] = useState<Tab>('grid');

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">20 Matchup</h2>
        <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setTab('grid')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tab === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Görsel
          </button>
          <button
            onClick={() => setTab('table')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              tab === 'table' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Tablo
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <MatchupGrid data={data} />
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <MatchupTable data={data} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function useMatchupRows(data: LeaderboardData | null) {
  return useMemo(() =>
    MATCHUPS.map((m) => {
      const s = data?.byMatchup?.[String(m.id)] ?? { gpt: 0, banana: 0, tie: 0, skip: 0 };
      const total = s.gpt + s.banana;
      const gPct = total ? Math.round((s.gpt / total) * 100) : 0;
      const bPct = total ? 100 - gPct : 0;
      const winner: 'gpt' | 'banana' | 'draw' | null =
        total === 0 ? null : s.gpt === s.banana ? 'draw' : s.gpt > s.banana ? 'gpt' : 'banana';
      return { m, s, total, gPct, bPct, winner };
    })
  , [data]);
}

function MatchupGrid({ data }: { data: LeaderboardData | null }) {
  const rows = useMatchupRows(data);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map(({ m, s, total, gPct, bPct, winner }, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: Math.min(0.02 * i, 0.25) }}
          className="glass rounded-xl overflow-hidden hover:border-white/20 transition-colors"
          style={{ borderColor: `${CATEGORY_COLORS[m.category]}22` }}
        >
          <div className="grid grid-cols-2 gap-px bg-black/40">
            <div className="aspect-square bg-bg-2 overflow-hidden">
              <img src={m.gpt} alt="GPT" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-square bg-bg-2 overflow-hidden">
              {m.bananaMissing ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">—</div>
              ) : (
                <img src={m.banana} alt="Banana" loading="lazy" className="w-full h-full object-cover" />
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CategoryBadge category={m.category} size="sm" />
              <span className="text-[11px] text-gray-500 font-mono">#{m.id}</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5rem] mb-3">{m.prompt}</p>
            {total === 0 ? (
              <div className="text-[11px] text-gray-600">Henüz oy yok</div>
            ) : (
              <>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className={winner === 'gpt' ? 'text-gpt-soft' : 'text-gray-400'}>GPT {gPct}%</span>
                  <span className={winner === 'banana' ? 'text-banana-soft' : 'text-gray-400'}>{bPct}% Banana</span>
                </div>
                <ScoreBar gpt={s.gpt} banana={s.banana} height="h-1.5" />
                <div className="text-[10px] text-gray-600 mt-2">{total} oy</div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MatchupTable({ data }: { data: LeaderboardData | null }) {
  const rows = useMatchupRows(data);
  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-gray-500 bg-white/[0.02]">
              <th className="text-left px-4 py-3 font-medium w-12">#</th>
              <th className="text-left px-3 py-3 font-medium">Kategori</th>
              <th className="text-left px-3 py-3 font-medium">Prompt</th>
              <th className="text-right px-3 py-3 font-medium text-gpt-soft">GPT</th>
              <th className="text-center px-3 py-3 font-medium w-[20%]">Dağılım</th>
              <th className="text-left px-3 py-3 font-medium text-banana-soft">Banana</th>
              <th className="text-right px-4 py-3 font-medium">Oy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, s, total, gPct, bPct, winner }) => (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">#{m.id}</td>
                <td className="px-3 py-3"><CategoryBadge category={m.category} size="sm" /></td>
                <td className="px-3 py-3 text-gray-300 max-w-[340px]">
                  <div className="truncate" title={m.prompt}>{m.prompt}</div>
                </td>
                <td className="text-right px-3 py-3 font-mono tabular-nums">
                  <div className={`font-bold ${winner === 'gpt' ? 'text-gpt-soft' : 'text-gray-300'}`}>
                    {total ? `${gPct}%` : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500">{s.gpt}</div>
                </td>
                <td className="px-3 py-3 min-w-[140px]">
                  {total === 0 ? (
                    <div className="text-center text-[11px] text-gray-600">—</div>
                  ) : (
                    <ScoreBar gpt={s.gpt} banana={s.banana} height="h-1.5" />
                  )}
                </td>
                <td className="text-left px-3 py-3 font-mono tabular-nums">
                  <div className={`font-bold ${winner === 'banana' ? 'text-banana-soft' : 'text-gray-300'}`}>
                    {total ? `${bPct}%` : '—'}
                  </div>
                  <div className="text-[11px] text-gray-500">{s.banana}</div>
                </td>
                <td className="text-right px-4 py-3 text-gray-400 tabular-nums">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked list */}
      <div className="md:hidden divide-y divide-white/5">
        {rows.map(({ m, s, total, gPct, bPct, winner }) => (
          <div key={m.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-gray-500">#{m.id}</span>
                <CategoryBadge category={m.category} size="sm" />
              </div>
              <span className="text-[11px] text-gray-500">{total} oy</span>
            </div>
            <div className="text-xs text-gray-400 truncate mb-2">{m.prompt}</div>
            {total === 0 ? (
              <div className="text-[11px] text-gray-600">Henüz oy yok</div>
            ) : (
              <>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className={winner === 'gpt' ? 'text-gpt-soft' : 'text-gray-300'}>GPT {gPct}% ({s.gpt})</span>
                  <span className={winner === 'banana' ? 'text-banana-soft' : 'text-gray-300'}>({s.banana}) {bPct}% Banana</span>
                </div>
                <ScoreBar gpt={s.gpt} banana={s.banana} height="h-1.5" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
