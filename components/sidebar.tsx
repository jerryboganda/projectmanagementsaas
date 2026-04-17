"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  ListTodo,
  Eye,
  Briefcase,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  Calendar,
  Users,
  Target,
  FileText,
  BarChart2,
  Settings,
  HelpCircle,
  Activity,
  X,
  Zap,
  Clock,
  IterationCw,
  ClipboardList,
  LayoutTemplate,
} from "lucide-react";
import { useInbox } from "@/contexts/inbox-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { overlayVariants, spring } from "@/lib/motion";

const navItems = [
  { icon: Briefcase, label: "Projects", href: "/projects" },
  { icon: FolderKanban, label: "Portfolio", href: "/portfolio" },
  { icon: LayoutDashboard, label: "Board", href: "/board" },
  { icon: IterationCw, label: "Sprints", href: "/sprints" },
  { icon: LineChart, label: "Timeline", href: "/timeline" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Users, label: "Workload", href: "/workload" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Clock, label: "Time Tracking", href: "/time-tracking" },
  { icon: FileText, label: "Docs", href: "/docs" },
  { icon: BarChart2, label: "Reports", href: "/reports" },
  { icon: Zap, label: "Automations", href: "/automations" },
  { icon: ClipboardList, label: "Intake", href: "/intake" },
  { icon: LayoutTemplate, label: "Templates", href: "/templates" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { unreadCount } = useInbox();

  const handleViewsClick = () => {
    onNavigate?.();
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const handleHelpClick = () => {
    onNavigate?.();
    window.open("https://linear.app/docs", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="p-4 border-b border-neutral-border flex items-center gap-3">
        <div className="size-6 bg-primary flex items-center justify-center rounded-sm">
          <Activity className="size-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold leading-tight tracking-tight text-slate-100">Linear Precision</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">PM Workspace</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" aria-label="Main navigation">
        <Link
          href="/inbox"
          onClick={onNavigate}
          aria-current={pathname === '/inbox' ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-sm transition-colors group ${pathname === '/inbox' ? 'bg-white/5 text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
        >
          <Inbox className="size-[18px]" />
          <span className="text-[13px] flex-1">Inbox</span>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="unread"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.16 }}
                className="text-[10px] font-mono bg-primary/20 text-primary px-1.5 rounded-full"
              >
                {unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Link
          href="/"
          onClick={onNavigate}
          aria-current={pathname === '/' ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-sm transition-colors ${pathname === '/' ? 'bg-white/5 text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
        >
          <ListTodo className="size-[18px]" />
          <span className="text-[13px]">My Issues</span>
        </Link>
        <button
          onClick={handleViewsClick}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer rounded-sm transition-colors"
        >
          <Eye className="size-[18px]" />
          <span className="text-[13px]">Views</span>
        </button>

        <div className="pt-4 pb-2 px-3">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Navigation</p>
        </div>

        {navItems.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            onClick={onNavigate}
            aria-current={pathname === item.href ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-sm transition-colors ${pathname === item.href ? 'bg-white/5 text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
          >
            <item.icon className="size-[18px]" />
            <span className="text-[13px]">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-border space-y-1">
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={pathname?.startsWith('/settings') ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-1.5 cursor-pointer rounded-sm transition-colors ${pathname?.startsWith('/settings') ? 'bg-white/5 text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
        >
          <Settings className="size-[18px]" />
          <span className="text-[13px]">Settings</span>
        </Link>
        <button
          onClick={handleHelpClick}
          className="w-full flex items-center gap-3 px-3 py-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer rounded-sm transition-colors"
        >
          <HelpCircle className="size-[18px]" />
          <span className="text-[13px]">Help</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-neutral-border bg-neutral-surface flex-col h-full" role="navigation" aria-label="Sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={spring.drawer}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fixed inset-y-0 left-0 w-72 bg-neutral-surface border-r border-neutral-border flex flex-col z-50 md:hidden"
            >
              <div className="absolute right-2 top-3 z-10">
                <button
                  onClick={closeMobile}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <SidebarContent onNavigate={closeMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
