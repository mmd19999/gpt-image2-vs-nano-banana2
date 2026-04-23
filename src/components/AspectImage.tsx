import { aspectRatioValue } from '../data/matchups';
import type { AspectRatio } from '../types';

export default function AspectImage({
  src,
  alt,
  aspect,
  className = '',
  missing = false,
  missingTitle = 'Görsel üretilmedi',
  missingReason,
  onLoad,
}: {
  src: string;
  alt: string;
  aspect: AspectRatio;
  className?: string;
  missing?: boolean;
  missingTitle?: string;
  missingReason?: string;
  onLoad?: () => void;
}) {
  const ar = aspectRatioValue(aspect);
  const style = { aspectRatio: `${ar}` };
  if (missing) {
    return (
      <div
        className={`w-full rounded-xl bg-gradient-to-br from-bg-2 to-bg-3 border border-dashed border-white/10 flex items-center justify-center text-center p-6 sm:p-8 ${className}`}
        style={style}
      >
        <div className="max-w-xs">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">
            🚫
          </div>
          <div className="text-sm font-semibold text-gray-200 mb-2">{missingTitle}</div>
          {missingReason && (
            <div className="text-xs text-gray-400 leading-relaxed">{missingReason}</div>
          )}
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={onLoad}
      className={`w-full rounded-xl object-cover bg-bg-2 ${className}`}
      style={style}
    />
  );
}
