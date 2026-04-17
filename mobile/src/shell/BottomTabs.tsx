import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Inbox, ListTodo, Folders, Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { haptics, spring } from '../motion';

const TABS = [
  { to: '/', label: 'Inbox', icon: Inbox, end: true },
  { to: '/issues', label: 'Issues', icon: ListTodo, end: false },
  { to: '/projects', label: 'Projects', icon: Folders, end: false },
  { to: '/search', label: 'Search', icon: Search, end: false },
] as const;

export function BottomTabs() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      const matchTab = (path: string) =>
        TABS.find((t) => (t.end ? path === t.to : path === t.to || path.startsWith(t.to + '/')));
      const prevTab = matchTab(previousPath.current);
      const nextTab = matchTab(pathname);
      if (prevTab?.to !== nextTab?.to) {
        void haptics.light();
      }
      previousPath.current = pathname;
    }
  }, [pathname]);

  return (
    <nav
      className="fixed left-0 right-0 bottom-0 z-50 border-t border-[#1A1A1A] bg-[#0A0A0A]"
      style={{ paddingBottom: 'var(--safe-bottom)', height: 'calc(var(--tab-bar-height) + var(--safe-bottom))' }}
    >
      <ul className="grid grid-cols-4 h-[var(--tab-bar-height)]">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex relative">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 relative transition-colors ${
                  isActive ? 'text-[#0066FF]' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="bottom-tab-indicator"
                      transition={spring.tab}
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-full bg-[#0066FF]"
                    />
                  )}
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    transition={spring.snappy}
                    className="flex flex-col items-center gap-1"
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} fill={isActive && label === 'Inbox' ? 'currentColor' : 'none'} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em]">{label}</span>
                  </motion.span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
