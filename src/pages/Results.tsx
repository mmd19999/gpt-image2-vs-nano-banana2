import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { getLocalVotes, resetVotes } from '../lib/session';
import { MATCHUPS } from '../data/matchups';
import { fetchLeaderboard } from '../lib/api';
import type { LeaderboardData } from '../types';

export default function Results() {
  const navigate = useNavigate();
  const votes = getLocalVotes();
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const byMatchup = new Map(MATCHUPS.map((m) => [m.id, m]));
  const mine = { gpt: 0, banana: 0, tie: 0, skip: 0 };
  for (const v of votes) mine[v.choice]++;
  const total = votes.length;
  const decisive = mine.gpt + mine.banana;
  const winner: 'gpt' | 'banana' | 'draw' | null =
    total === 0 ? null : mine.gpt === mine.banana ? 'draw' : mine.gpt > mine.banana ? 'gpt' : 'banana';

  useEffect(() => {
    fetchLeaderboard().then(setLeaderboard).catch(() => {});
  }, []);

  // Agreement with community
  let agreementMatches = 0;
  let agreementBase = 0;
  if (leaderboard) {
    for (const v of votes) {
      const s = leaderboard.byMatchup[String(v.matchupId)];
      if (!s) continue;
      const tot = s.gpt + s.banana + s.tie + s.skip;
      if (tot < 3) continue;
      const entries: Array<['gpt' | 'banana' | 'tie' | 'skip', number]> = [
        ['gpt', s.gpt],
        ['banana', s.banana],
        ['tie', s.tie],
        ['skip', s.skip],
      ];
      const majority = entries.sort((a, b) => b[1] - a[1])[0][0];
      agreementBase++;
      if (majority === v.choice) agreementMatches++;
    }
  }
  const agreementPct = agreementBase ? Math.round((agreementMatches / agreementBase) * 100) : null;

  async function downloadCard() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#07070B',
      });
      const link = document.createElement('a');
      link.download = 'gpt-vs-banana-oyum.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  }

  function shareTwitter() {
    const text = encodeURIComponent(
      `GPT Image 2 vs Nano Banana 2 — ${total} oydan ${mine.gpt}'inde GPT'yi, ${mine.banana}'inde Banana'yı seçtim. Sen de dene:`
    );
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Henüz oy kullanmadın</h2>
        <p className="text-gray-400 mb-6">Sonuçları görmek için önce oylamaya başla.</p>
        <Link to="/oyla" className="btn-primary">
          Oylamaya Başla →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Teşekkürler!</h1>
          <p className="text-gray-400 text-sm">Oyların kayda alındı ve leaderboard'a yansıdı.</p>
        </div>

        {/* Shareable card */}
        <div
          ref={cardRef}
          className="rounded-2xl p-8 mb-6"
          style={{
            background:
              'radial-gradient(ellipse 600px 400px at 20% 0%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(ellipse 500px 400px at 100% 100%, rgba(6,182,212,0.22), transparent 60%), #0A0A0F',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gpt to-banana flex items-center justify-center">
              <span className="text-[11px] font-black text-white">VS</span>
            </div>
            <div className="leading-tight">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">AI Matchup</div>
              <div className="text-sm font-bold">
                <span className="text-gpt-soft">GPT Image 2</span>
                <span className="text-gray-500 mx-1">vs</span>
                <span className="text-banana-soft">Nano Banana 2</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Benim Oylarım</div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 bg-gpt/10 border border-gpt/30">
              <div className="text-gpt-soft font-bold text-xs mb-1">GPT Image 2</div>
              <div className="text-3xl font-black text-white">{mine.gpt}</div>
              <div className="text-[11px] text-gray-400">{decisive ? Math.round((mine.gpt / decisive) * 100) : 0}%</div>
            </div>
            <div className="rounded-xl p-4 bg-banana/10 border border-banana/30">
              <div className="text-banana-soft font-bold text-xs mb-1">Nano Banana 2</div>
              <div className="text-3xl font-black text-white">{mine.banana}</div>
              <div className="text-[11px] text-gray-400">{decisive ? Math.round((mine.banana / decisive) * 100) : 0}%</div>
            </div>
          </div>

          <div className="rounded-lg px-3 py-2 bg-white/5 mb-5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Karar veremedim</div>
            <div className="text-lg font-bold text-gray-300">{mine.skip + mine.tie}</div>
          </div>

          {winner && winner !== 'draw' && (
            <div className="text-center py-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Benim Galibim</div>
              <div className={`text-xl font-black ${winner === 'gpt' ? 'text-gpt-soft' : 'text-banana-soft'}`}>
                {winner === 'gpt' ? 'GPT Image 2' : 'Nano Banana 2'}
              </div>
            </div>
          )}
          {winner === 'draw' && (
            <div className="text-center py-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xl font-black text-white">Berabere</div>
            </div>
          )}

          {agreementPct !== null && (
            <div className="mt-4 text-center text-xs text-gray-400">
              Topluluk çoğunluğuyla <span className="text-white font-bold">%{agreementPct}</span> uyumlu seçim yaptın
              <span className="text-gray-600"> ({agreementBase} matchupta)</span>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-white/5 text-[10px] text-gray-500 text-center">
            {byMatchup.size} matchup · GPT Image 2 vs Nano Banana 2 · {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <button onClick={downloadCard} disabled={downloading} className="btn-primary">
            {downloading ? 'Hazırlanıyor...' : 'Kartı İndir (PNG)'}
          </button>
          <button onClick={shareTwitter} className="btn-secondary">
            Twitter'da Paylaş
          </button>
          <Link to="/" className="btn-secondary">
            Leaderboard'a Dön
          </Link>
          <button
            onClick={() => {
              resetVotes();
              navigate('/oyla');
            }}
            className="btn-secondary !text-gray-500"
            title="Yerel oylarını sıfırla"
          >
            Sıfırla & Yeniden Oyla
          </button>
        </div>
      </motion.div>
    </div>
  );
}
