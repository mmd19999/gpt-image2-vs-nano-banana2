import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MATCHUPS } from '../data/matchups';
import type { Matchup, VoteChoice } from '../types';
import { getLocalVotes, saveLocalVote, resetVotes } from '../lib/session';
import { submitVote } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import AspectImage from '../components/AspectImage';
import Lightbox from '../components/Lightbox';

type Phase = 'choosing' | 'revealing';

function pickStartIndex(): number {
  const voted = new Set(getLocalVotes().map((v) => v.matchupId));
  const first = MATCHUPS.findIndex((m) => !voted.has(m.id));
  return first === -1 ? 0 : first;
}

export default function Vote() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState<number>(() => pickStartIndex());
  const [phase, setPhase] = useState<Phase>('choosing');
  const [choice, setChoice] = useState<VoteChoice | null>(null);
  const [communityStats, setCommunityStats] = useState<{ gpt: number; banana: number; tie: number; skip: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<{ src: string; caption?: string } | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const matchup: Matchup | undefined = MATCHUPS[idx];

  // GPT always on the left, Nano Banana always on the right — açık karşılaştırma
  const leftSrc = matchup ? matchup.gpt : '';
  const rightSrc = matchup ? matchup.banana : '';
  const leftMissing = matchup ? !!matchup.gptMissing : false;
  const rightMissing = matchup ? !!matchup.bananaMissing : false;

  const votedCount = getLocalVotes().length;
  const progress = votedCount + (phase !== 'choosing' ? 1 : 0);

  const handleVote = useCallback(
    async (c: VoteChoice) => {
      if (!matchup || phase !== 'choosing' || submitting) return;
      setSubmitting(true);
      setError(null);
      setChoice(c);
      setPhase('revealing');

      saveLocalVote({ matchupId: matchup.id, choice: c, ts: Date.now() });

      const res = await submitVote(matchup.id, c);
      if (!res.ok) {
        setError(res.error ?? 'Bir hata oluştu');
      }
      if (res.stats) setCommunityStats(res.stats);
      setSubmitting(false);

      advanceTimer.current = window.setTimeout(() => {
        const next = idx + 1;
        if (next >= MATCHUPS.length) {
          navigate('/sonuc');
        } else {
          setIdx(next);
          setChoice(null);
          setCommunityStats(null);
          setPhase('choosing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 1800);
    },
    [matchup, phase, submitting, idx, navigate]
  );

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (zoom) return;
      if (phase !== 'choosing') return;
      if (e.key === '1') handleVote('gpt');
      else if (e.key === '2' && !rightMissing) handleVote('banana');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleVote, phase, zoom, rightMissing]);

  if (!matchup) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Tüm matchup'lara oy verdin 🎉</h2>
        <p className="text-gray-400 mb-6">Sonuç sayfasına ilerle veya oylamayı sıfırla.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/sonuc')} className="btn-primary">
            Sonuçlarımı Gör
          </button>
          <button
            onClick={() => {
              resetVotes();
              setIdx(0);
            }}
            className="btn-secondary"
          >
            Oylamayı Sıfırla
          </button>
        </div>
      </div>
    );
  }

  const communityTotal = communityStats
    ? communityStats.gpt + communityStats.banana + communityStats.tie + communityStats.skip
    : 0;
  const agreementPct = (() => {
    if (!communityStats || !choice) return null;
    if (communityTotal < 5) return null;
    const match = communityStats[choice];
    return Math.round((match / communityTotal) * 100);
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="font-mono">{Math.min(progress, MATCHUPS.length)} / {MATCHUPS.length}</span>
          <CategoryBadge category={matchup.category} size="sm" />
        </div>
        <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gpt to-banana"
            initial={{ width: 0 }}
            animate={{ width: `${(progress / MATCHUPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="glass rounded-xl p-4 sm:p-5 mb-4">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Prompt</div>
        <p className="text-sm sm:text-base text-gray-200 leading-relaxed">{matchup.prompt}</p>

        {matchup.references && matchup.references.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">
                Prompt'a eklenen referanslar ({matchup.references.length})
              </div>
              <div className="text-[10px] text-gray-500">Tıkla → büyüt</div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {matchup.references.map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setZoom({ src: r, caption: `Referans #${i + 1}` })}
                  className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-gpt-soft"
                  aria-label={`Referans ${i + 1}, büyütmek için tıkla`}
                >
                  <img
                    src={r}
                    alt={`Referans ${i + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-lg">⤢</span>
                  </div>
                  <div className="absolute bottom-1 left-1 text-[9px] font-mono text-white/90 bg-black/60 rounded px-1.5 py-0.5">
                    #{i + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Images — labels always visible */}
      <AnimatePresence mode="wait">
        <motion.div
          key={matchup.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5"
        >
          {/* GPT (left) */}
          <div className="relative">
            <div className="absolute -top-3 left-3 z-10 px-3 py-1 rounded-full bg-gpt text-white text-xs font-bold shadow-lg shadow-gpt/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              GPT Image 2
            </div>
            <button
              type="button"
              disabled={leftMissing}
              onClick={() => !leftMissing && setZoom({ src: leftSrc, caption: 'GPT Image 2' })}
              className="block w-full cursor-zoom-in disabled:cursor-default focus:outline-none"
              aria-label="GPT Image 2 sonucunu büyüt"
            >
              <AspectImage
                src={leftSrc}
                alt="GPT Image 2"
                aspect={matchup.aspectRatio}
                missing={leftMissing}
                className={`transition-all ring-1 ring-gpt/30 ${
                  phase !== 'choosing' && choice === 'gpt' ? 'ring-2 ring-win shadow-[0_0_40px_rgba(16,185,129,0.35)]' : ''
                } ${phase !== 'choosing' && choice === 'banana' ? 'opacity-50' : ''}`}
              />
            </button>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-mono text-gray-300 flex items-center gap-1 pointer-events-none">
              <span>1</span><span className="text-gray-500">·</span><span>⤢</span>
            </div>
          </div>

          {/* Nano Banana (right) */}
          <div className="relative">
            <div className="absolute -top-3 left-3 z-10 px-3 py-1 rounded-full bg-banana text-white text-xs font-bold shadow-lg shadow-banana/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Nano Banana 2
            </div>
            <button
              type="button"
              disabled={rightMissing}
              onClick={() => !rightMissing && setZoom({ src: rightSrc, caption: 'Nano Banana 2' })}
              className="block w-full cursor-zoom-in disabled:cursor-default focus:outline-none"
              aria-label="Nano Banana 2 sonucunu büyüt"
            >
              <AspectImage
                src={rightSrc}
                alt="Nano Banana 2"
                aspect={matchup.aspectRatio}
                missing={rightMissing}
                missingTitle="Nano Banana 2 üretmedi"
                missingReason={matchup.missingReason}
                className={`transition-all ring-1 ring-banana/30 ${
                  phase !== 'choosing' && choice === 'banana' ? 'ring-2 ring-win shadow-[0_0_40px_rgba(16,185,129,0.35)]' : ''
                } ${phase !== 'choosing' && choice === 'gpt' ? 'opacity-50' : ''}`}
              />
            </button>
            {!rightMissing && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-mono text-gray-300 flex items-center gap-1 pointer-events-none">
                <span>2</span><span className="text-gray-500">·</span><span>⤢</span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <Lightbox
        src={zoom?.src ?? null}
        caption={zoom?.caption}
        onClose={() => setZoom(null)}
      />

      {/* Buttons */}
      {rightMissing ? (
        <div className="space-y-3">
          <VoteBtn
            disabled={phase !== 'choosing' || leftMissing}
            onClick={() => handleVote('gpt')}
            kbd="1"
            label="GPT Image 2'yi seç"
            variant="gpt"
            active={choice === 'gpt'}
          />
          <p className="text-center text-xs text-gray-500">
            Nano Banana 2 bu promptu reddettiği için oylama yalnızca GPT Image 2 için açık.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <VoteBtn disabled={phase !== 'choosing' || leftMissing} onClick={() => handleVote('gpt')} kbd="1" label="GPT Image 2" variant="gpt" active={choice === 'gpt'} />
          <VoteBtn disabled={phase !== 'choosing' || rightMissing} onClick={() => handleVote('banana')} kbd="2" label="Nano Banana 2" variant="banana" active={choice === 'banana'} />
        </div>
      )}

      {/* Feedback */}
      <div className="min-h-[80px] mt-5">
        <AnimatePresence>
          {phase !== 'choosing' && agreementPct !== null && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-gray-300"
            >
              Topluluğun <span className="font-bold text-white">%{agreementPct}</span>'i seninle aynı seçimi yaptı
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-center text-xs text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[11px] text-gray-600 mt-4">
        Klavye: 1 = GPT Image 2, 2 = Nano Banana 2 · Oy verdikten sonra değiştirilemez
      </p>
    </div>
  );
}

function VoteBtn({
  onClick,
  disabled,
  kbd,
  label,
  variant,
  active,
}: {
  onClick: () => void;
  disabled: boolean;
  kbd: string;
  label: string;
  variant: 'gpt' | 'banana';
  active: boolean;
}) {
  const base = 'relative w-full rounded-xl py-4 sm:py-5 px-3 font-semibold text-sm sm:text-base transition-all border disabled:cursor-not-allowed';
  const styles = {
    gpt: active
      ? 'bg-gpt/25 border-gpt text-white shadow-glow'
      : 'bg-gpt/10 border-gpt/40 text-gpt-soft hover:bg-gpt/20 hover:border-gpt',
    banana: active
      ? 'bg-banana/25 border-banana text-white shadow-glow-banana'
      : 'bg-banana/10 border-banana/40 text-banana-soft hover:bg-banana/20 hover:border-banana',
  }[variant];

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${disabled ? 'opacity-60' : ''}`}>
      <kbd className="absolute top-2 right-2 text-[10px] font-mono text-gray-400 border border-white/10 rounded px-1 py-[1px]">
        {kbd}
      </kbd>
      <span className="block">{label}</span>
    </button>
  );
}
