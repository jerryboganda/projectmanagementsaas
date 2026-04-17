import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';

export function NotFoundScreen() {
  return (
    <ScreenContainer>
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#0066FF]/10 border border-[#0066FF]/30">
          <Compass className="w-5 h-5 text-[#0066FF]" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-100">Nothing here</h1>
        <p className="mt-1 text-[13px] text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-[4px] bg-[#0066FF] px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white active:opacity-90"
        >
          Back to Inbox
        </Link>
      </div>
    </ScreenContainer>
  );
}
