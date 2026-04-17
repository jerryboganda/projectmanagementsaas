"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  Plus,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { useInbox } from "@/contexts/inbox-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAiCopilot } from "@/components/ai-copilot-provider";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNewItem?: () => void;
  newItemLabel?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function Header({
  title = "Personal Triage",
  subtitle = "Sprint 24",
  onNewItem,
  newItemLabel = "Issue",
  onSearch,
  searchPlaceholder = "Search...",
}: HeaderProps) {
  const router = useRouter();
  const { toggleMobile } = useSidebar();
  const { unreadCount } = useInbox();
  const { session, logout } = useAuth();
  const { toast } = useToast();
  const { toggle: toggleAiCopilot, isOpen: isAiCopilotOpen } = useAiCopilot();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const userName =
    session?.user.displayName?.trim() || session?.user.fullName || "Workspace User";
  const userEmail = session?.user.email || "workspace@linearprecision.com";
  const userInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSignOut() {
    try {
      await logout();
      toast({
        type: "success",
        title: "Signed out",
        message: "Your session has been closed successfully.",
      });
      router.replace("/login");
    } catch {
      toast({
        type: "error",
        title: "Sign-out failed",
        message: "We could not close your session cleanly. Please try again.",
      });
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-neutral-border bg-neutral-surface/50 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleMobile}
          className="rounded-sm p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="size-5" />
        </button>
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h2>
        {subtitle ? (
          <>
            <div className="hidden h-4 w-px bg-neutral-border sm:block" />
            <div className="hidden gap-2 sm:flex">
              <span className="rounded-sm border border-neutral-border px-2 py-0.5 font-mono text-[11px] uppercase text-slate-500">
                {subtitle}
              </span>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-command-palette"));
            onSearch?.("");
          }}
          className="hidden h-8 w-64 items-center gap-2 rounded-sm border border-neutral-border bg-transparent px-3 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-400 md:flex"
          aria-label="Search"
        >
          <Search className="size-[14px]" />
          <span className="flex-1 text-left text-[13px]">{searchPlaceholder}</span>
          <kbd className="rounded border border-neutral-border px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
            Ctrl K
          </kbd>
        </button>

        <div className="flex gap-1">
          <button
            onClick={toggleAiCopilot}
            className={cn(
              "flex h-8 items-center justify-center rounded-sm border px-2 transition-colors",
              isAiCopilotOpen
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-neutral-border text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
            aria-label="Toggle AI Copilot"
          >
            <Sparkles className="size-[16px]" />
          </button>

          <button
            onClick={() => router.push("/inbox")}
            className="relative flex h-8 items-center justify-center rounded-sm border border-neutral-border px-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label="Notifications"
          >
            <Bell className="size-[16px]" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary font-mono text-[9px] text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={onNewItem}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-primary bg-primary px-2 text-white transition-colors hover:bg-primary/90 md:px-3"
          >
            <Plus className="size-[16px]" />
            <span className="hidden text-[12px] font-medium md:inline">{newItemLabel}</span>
          </button>
        </div>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-sm p-0.5 transition-colors hover:bg-white/5"
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <div className="grid size-8 flex-shrink-0 place-items-center overflow-hidden rounded-sm border border-neutral-border bg-slate-800">
              {session?.user.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt={`${userName} avatar`}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-[11px] font-semibold text-slate-200">
                  {userInitials || "WU"}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "hidden size-3 text-slate-500 transition-transform md:block",
                profileOpen && "rotate-180",
              )}
            />
          </button>

          {profileOpen ? (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-sm border border-neutral-border bg-neutral-surface shadow-xl" role="menu">
              <div className="border-b border-neutral-border px-3 py-2.5">
                <p className="text-[13px] font-medium text-slate-200">{userName}</p>
                <p className="text-[11px] text-slate-500">{userEmail}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                  role="menuitem"
                >
                  <User className="size-[14px]" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                  role="menuitem"
                >
                  <Settings className="size-[14px]" />
                  Settings
                </button>
              </div>

              <div className="border-t border-neutral-border py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    void handleSignOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400"
                  role="menuitem"
                >
                  <LogOut className="size-[14px]" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
