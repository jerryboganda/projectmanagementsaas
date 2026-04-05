'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Users,
  UsersRound,
  CreditCard,
  Blocks,
  Shield,
  User,
  Bell,
  Palette,
  Search,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SettingsCategory, type SettingsSection, settingsSections } from './data';

interface SettingsSidebarProps {
  activeCategory: SettingsCategory;
  onSelectCategory: (category: SettingsCategory) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Settings,
  Users,
  UsersRound,
  CreditCard,
  Blocks,
  Shield,
  User,
  Bell,
  Palette
};

/** Maps each settings category id to a set of searchable keywords so the
 *  sidebar search can match against more than just the visible label. */
const CATEGORY_DESCRIPTIONS: Record<SettingsCategory, string> = {
  general: 'workspace name branding logo timezone date time regional defaults',
  members: 'invite users roles access permissions teammates collaborators',
  teams: 'groups departments squads engineering design product marketing',
  billing: 'plans subscription pricing invoices payment stripe credits usage',
  integrations: 'github slack figma sentry connect apps plugins webhooks',
  security: 'password authentication mfa two-factor lockout recovery audit',
  profile: 'account name email avatar display job title locale',
  notifications: 'alerts email push in-app mentions assignments updates',
  appearance: 'theme dark light accent color font size density layout language',
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-primary/30 text-slate-100 rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SidebarButton({
  section,
  isActive,
  isSearchMatch,
  searchQuery,
  onSelect,
}: {
  section: SettingsSection;
  isActive: boolean;
  isSearchMatch: boolean;
  searchQuery: string;
  onSelect: () => void;
}) {
  const Icon = iconMap[section.icon];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center px-5 py-2 text-sm transition-colors group relative',
        isActive
          ? 'text-slate-100 font-medium'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
        isSearchMatch && !isActive && 'bg-primary/5 border-l-2 border-primary/40'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-settings-indicator"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary"
        />
      )}
      {isActive && (
        <motion.div
          layoutId="active-settings-bg"
          className="absolute inset-0 bg-white/5"
        />
      )}
      <Icon className={cn(
        'w-4 h-4 mr-3 relative z-10',
        isActive ? 'text-primary' : isSearchMatch ? 'text-primary/70' : 'text-slate-500 group-hover:text-slate-400'
      )} />
      <span className="relative z-10">
        <HighlightedText text={section.label} query={searchQuery} />
      </span>
    </button>
  );
}

export function SettingsSidebar({ activeCategory, onSelectCategory }: SettingsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { workspaceSections, accountSections, matchingIds } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const matchIds = new Set<SettingsCategory>();
    if (query) {
      for (const section of settingsSections) {
        const labelMatch = section.label.toLowerCase().includes(query);
        const descriptionMatch = CATEGORY_DESCRIPTIONS[section.id]?.toLowerCase().includes(query);
        if (labelMatch || descriptionMatch) {
          matchIds.add(section.id);
        }
      }
    }

    const filtered = query
      ? settingsSections.filter((s) => matchIds.has(s.id))
      : settingsSections;

    return {
      workspaceSections: filtered.filter((s) => s.group === 'workspace'),
      accountSections: filtered.filter((s) => s.group === 'account'),
      matchingIds: matchIds,
    };
  }, [searchQuery]);

  const hasResults = workspaceSections.length > 0 || accountSections.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="w-64 flex-shrink-0 border-r border-neutral-border bg-neutral-surface flex flex-col h-full z-10">
      {/* Header */}
      <div className="p-5 border-b border-neutral-border/50">
        <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Settings</h2>
        <p className="text-xs text-slate-400 mt-1">Manage workspace preferences</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-neutral-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className={cn(
              'w-full bg-background-dark border border-neutral-border rounded-md pl-9 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow',
              searchQuery ? 'pr-8' : 'pr-3'
            )}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.1 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">

        {!hasResults && isSearching ? (
          <div className="px-5 py-6 text-center">
            <Search className="mx-auto mb-2 w-5 h-5 text-slate-600" />
            <p className="text-sm text-slate-500">No settings match</p>
            <p className="text-xs text-slate-600 mt-1">
              &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <>
            {/* Workspace Group */}
            {workspaceSections.length > 0 && (
              <div className="mb-6">
                <div className="px-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace</div>
                <div className="space-y-0.5">
                  {workspaceSections.map((section) => (
                    <SidebarButton
                      key={section.id}
                      section={section}
                      isActive={activeCategory === section.id}
                      isSearchMatch={isSearching && matchingIds.has(section.id)}
                      searchQuery={isSearching ? searchQuery : ''}
                      onSelect={() => onSelectCategory(section.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Account Group */}
            {accountSections.length > 0 && (
              <div className="mb-6">
                <div className="px-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">My Account</div>
                <div className="space-y-0.5">
                  {accountSections.map((section) => (
                    <SidebarButton
                      key={section.id}
                      section={section}
                      isActive={activeCategory === section.id}
                      isSearchMatch={isSearching && matchingIds.has(section.id)}
                      searchQuery={isSearching ? searchQuery : ''}
                      onSelect={() => onSelectCategory(section.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
