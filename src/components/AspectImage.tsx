import { aspectRatioValue } from '../data/matchups';
import type { AspectRatio } from '../types';

export default function AspectImage({
  src,
  alt,
  aspect,
  className = '',
  missing = false,
  onLoad,
}: {
  src: string;
  alt: string;
  aspect: AspectRatio;
  className?: string;
  missing?: boolean;
  onLoad?: () => void;
}) {
  const ar = aspectRatioValue(aspect);
  const style = { aspectRatio: `${ar}` };
  if (missing) {
    return (
      <div
        className={`w-full rounded-xl bg-gradient-to-br from-bg-2 to-bg-3 border border-white/5 flex items-center justify-center text-center p-6 ${className}`}
        style={style}
      >
        <div className="text-gray-500 text-sm">
          <div className="text-2xl mb-2">—</div>
          Bu matchup için görsel eksik
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
