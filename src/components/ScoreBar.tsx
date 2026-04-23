import { motion } from 'framer-motion';

export default function ScoreBar({
  gpt,
  banana,
  tie = 0,
  showCounts = false,
  height = 'h-3',
}: {
  gpt: number;
  banana: number;
  tie?: number;
  showCounts?: boolean;
  height?: string;
}) {
  const total = gpt + banana + tie || 1;
  const gptPct = (gpt / total) * 100;
  const bananaPct = (banana / total) * 100;
  const tiePct = (tie / total) * 100;

  return (
    <div className="w-full">
      <div className={`relative w-full ${height} rounded-full overflow-hidden bg-white/5 flex`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${gptPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-gpt to-gpt-soft"
        />
        {tie > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${tiePct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            className="h-full bg-win/60"
          />
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${bananaPct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          className="h-full bg-gradient-to-r from-banana-soft to-banana"
        />
      </div>
      {showCounts && (
        <div className="flex justify-between mt-1.5 text-[11px]">
          <span className="text-gpt-soft font-semibold">{Math.round(gptPct)}%</span>
          <span className="text-banana-soft font-semibold">{Math.round(bananaPct)}%</span>
        </div>
      )}
    </div>
  );
}
