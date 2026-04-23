import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const onVote = loc.pathname === '/oyla';
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gpt to-banana shadow-glow flex items-center justify-center">
              <span className="text-[10px] font-black text-white">VS</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] text-gray-400 tracking-wider">AI MATCHUP</span>
              <span className="text-[13px] font-bold text-white">
                <span className="text-gpt-soft">GPT Image 2</span>
                <span className="text-gray-500 mx-1.5">vs</span>
                <span className="text-banana-soft">Nano Banana 2</span>
              </span>
            </div>
          </Link>
          {!onVote && (
            <Link to="/oyla" className="btn-primary !py-2 !px-4 !text-sm">
              Oylamaya Başla
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-white/5 py-8 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4">
          Körlemesine karşılaştırma · Oyunuz sunucu tarafında Netlify Blobs ile saklanır
        </div>
      </footer>
    </div>
  );
}
