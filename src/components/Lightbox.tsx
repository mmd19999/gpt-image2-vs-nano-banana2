import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Lightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string | null;
  alt?: string;
  caption?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors"
          >
            ×
          </button>

          <motion.img
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            src={src}
            alt={alt ?? ''}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl cursor-default"
          />
          {caption && (
            <div className="mt-4 text-center text-sm text-gray-300 max-w-3xl px-4">
              {caption}
            </div>
          )}
          <div className="mt-2 text-[11px] text-gray-500">ESC veya boş alana tıkla · kapat</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
