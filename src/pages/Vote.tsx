import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MATCHUPS } from '../data/matchups';
import type { Matchup, VoteChoice } from '../types';
import { getLocalVotes, saveLocalVote, resetVotes } from '../lib/session';
import { submitVote } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import AspectImage from '../components/AspectImage';

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
      if (phase !== 'choosing') return;
      if (e.key === '1') handleVote('gpt');
      else if (e.key === '2') handleVote('banana');
      else if (e.key === '3') handleVote('tie');
      else if (e.key === '4') handleVote('skip');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleVote, phase]);

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
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
              Referanslar ({matchup.references.length})
            </div>
            <div className="flex gap-2 flex-wrap">
              {matchup.references.map((r) => (
                <img
                  key={r}
                  src={r}
                  alt="referans"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-white/10"
                  loading="lazy"
                />
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
            <AspectImage
              src={leftSrc}
              alt="GPT Image 2"
              aspect={matchup.aspectRatio}
              missing={leftMissing}
              className={`transition-all ring-1 ring-gpt/30 ${
                phase !== 'choosing' && choice === 'gpt' ? 'ring-2 ring-win shadow-[0_0_40px_rgba(16,185,129,0.35)]' : ''
              } ${phase !== 'choosing' && choice === 'banana' ? 'opacity-50' : ''}`}
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-mono text-gray-300">
              1
            </div>
          </div>

          {/* Nano Banana (right) */}
          <div className="relative">
            <div className="absolute -top-3 left-3 z-10 px-3 py-1 rounded-full bg-banana text-white text-xs font-bold shadow-lg shadow-banana/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Nano Banana 2
            </div>
            <AspectImage
              src={rightSrc}
              alt="Nano Banana 2"
              aspect={matchup.aspectRatio}
              missing={rightMissing}
              className={`transition-all ring-1 ring-banana/30 ${
                phase !== 'choosing' && choice === 'banana' ? 'ring-2 ring-win shadow-[0_0_40px_rgba(16,185,129,0.35)]' : ''
              } ${phase !== 'choosing' && choice === 'gpt' ? 'opacity-50' : ''}`}
            />
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-mono text-gray-300">
              2
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <VoteBtn disabled={phase !== 'choosing' || leftMissing} onClick={() => handleVote('gpt')} kbd="1" label="GPT Image 2" variant="gpt" active={choice === 'gpt'} />
        <VoteBtn disabled={phase !== 'choosing' || rightMissing} onClick={() => handleVote('banana')} kbd="2" label="Nano Banana 2" variant="banana" active={choice === 'banana'} />
        <VoteBtn disabled={phase !== 'choosing'} onClick={() => handleVote('tie')} kbd="3" label="İkisi de iyi" variant="tie" active={choice === 'tie'} />
        <VoteBtn disabled={phase !== 'choosing'} onClick={() => handleVote('skip')} kbd="4" label="Karar veremedim" variant="skip" active={choice === 'skip'} />
      </div>

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
        Klavye: 1 = GPT, 2 = Banana, 3 = İkisi de iyi, 4 = Kararsız · Oy verdikten sonra değiştirilemez
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
  variant: 'gpt' | 'banana' | 'tie' | 'skip';
  active: boolean;
}) {
  const base = 'relative rounded-xl py-4 px-3 font-semibold text-sm transition-all border disabled:cursor-not-allowed';
  const styles = {
    gpt: active
      ? 'bg-gpt/25 border-gpt text-white shadow-glow'
      : 'bg-gpt/10 border-gpt/40 text-gpt-soft hover:bg-gpt/20 hover:border-gpt',
    banana: active
      ? 'bg-banana/25 border-banana text-white shadow-glow-banana'
      : 'bg-banana/10 border-banana/40 text-banana-soft hover:bg-banana/20 hover:border-banana',
    tie: active
      ? 'bg-win/20 border-win text-white'
      : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20',
    skip: active
      ? 'bg-gray-600/30 border-gray-500 text-white'
      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20',
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
