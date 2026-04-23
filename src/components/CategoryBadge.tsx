import { CATEGORY_COLORS, CATEGORY_LABELS } from '../data/matchups';
import type { Category } from '../types';

export default function CategoryBadge({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const cls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cls}`}
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
