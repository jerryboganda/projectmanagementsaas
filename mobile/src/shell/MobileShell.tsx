import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TopBar } from './TopBar';
import { BottomTabs } from './BottomTabs';
import { transitions } from '../motion';

export function MobileShell() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      <TopBar />
      <main
        className="relative"
        style={{
          paddingTop: 'calc(var(--top-bar-height) + var(--safe-top))',
          paddingBottom: 'calc(var(--tab-bar-height) + var(--safe-bottom))',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomTabs />
    </div>
  );
}
