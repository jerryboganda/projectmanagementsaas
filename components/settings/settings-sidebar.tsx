'use client';

import { motion } from 'motion/react';
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
  Search
} from 'lucide-react';
import { SettingsCategory, settingsSections } from './data';

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

export function SettingsSidebar({ activeCategory, onSelectCategory }: SettingsSidebarProps) {
  const workspaceSections = settingsSections.filter(s => s.group === 'workspace');
  const accountSections = settingsSections.filter(s => s.group === 'account');

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
            placeholder="Search settings..." 
            className="w-full bg-background-dark border border-neutral-border rounded-md pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        
        {/* Workspace Group */}
        <div className="mb-6">
          <div className="px-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace</div>
          <div className="space-y-0.5">
            {workspaceSections.map(section => {
              const Icon = iconMap[section.icon];
              const isActive = activeCategory === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => onSelectCategory(section.id)}
                  className={`w-full flex items-center px-5 py-2 text-sm transition-colors group relative ${
                    isActive 
                      ? 'text-slate-100 font-medium' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
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
                  <Icon className={`w-4 h-4 mr-3 relative z-10 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span className="relative z-10">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Group */}
        <div className="mb-6">
          <div className="px-5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">My Account</div>
          <div className="space-y-0.5">
            {accountSections.map(section => {
              const Icon = iconMap[section.icon];
              const isActive = activeCategory === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => onSelectCategory(section.id)}
                  className={`w-full flex items-center px-5 py-2 text-sm transition-colors group relative ${
                    isActive 
                      ? 'text-slate-100 font-medium' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
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
                  <Icon className={`w-4 h-4 mr-3 relative z-10 ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span className="relative z-10">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
