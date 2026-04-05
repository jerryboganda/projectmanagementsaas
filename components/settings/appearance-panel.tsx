'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Sun,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeMode = 'dark' | 'light' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink';
type SidebarDensity = 'comfortable' | 'compact';
type FontSize = 'small' | 'medium' | 'large';
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';
type Language = 'en-US' | 'en-GB' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface AppearancePreferences {
  theme: ThemeMode;
  accent: AccentColor;
  density: SidebarDensity;
  fontSize: FontSize;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  language: Language;
}

const DEFAULTS: AppearancePreferences = {
  theme: 'dark',
  accent: 'blue',
  density: 'comfortable',
  fontSize: 'medium',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  language: 'en-US',
};

const STORAGE_KEY = 'lp-appearance-preferences';

/** Read persisted prefs from localStorage. Safe for SSR (returns empty). */
function loadStoredPreferences(): Partial<AppearancePreferences> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Partial<AppearancePreferences>;
  } catch {
    // Silently ignore corrupted localStorage data
  }
  return {};
}

const ACCENT_COLORS: { id: AccentColor; label: string; hex: string; cls: string }[] = [
  { id: 'blue', label: 'Blue', hex: '#1313ec', cls: 'bg-[#1313ec]' },
  { id: 'purple', label: 'Purple', hex: '#7c3aed', cls: 'bg-violet-600' },
  { id: 'green', label: 'Green', hex: '#059669', cls: 'bg-emerald-600' },
  { id: 'red', label: 'Red', hex: '#dc2626', cls: 'bg-red-600' },
  { id: 'orange', label: 'Orange', hex: '#ea580c', cls: 'bg-orange-600' },
  { id: 'pink', label: 'Pink', hex: '#db2777', cls: 'bg-pink-600' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese (Simplified)' },
];

function ThemeCard({
  mode,
  label,
  icon: Icon,
  selected,
  onClick,
}: {
  mode: ThemeMode;
  label: string;
  icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-xl border px-4 py-5 transition-all',
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
          : 'border-neutral-border bg-neutral-surface/30 hover:border-neutral-border/80 hover:bg-neutral-surface/50',
      )}
    >
      {selected && (
        <div className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-primary">
          <Check className="size-2.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          mode === 'dark'
            ? 'bg-zinc-800 border border-zinc-700'
            : mode === 'light'
            ? 'bg-zinc-100 border border-zinc-200'
            : 'bg-gradient-to-br from-zinc-800 to-zinc-100 border border-zinc-600',
        )}
      >
        <Icon
          className={cn(
            'size-5',
            mode === 'dark' ? 'text-slate-200' : mode === 'light' ? 'text-zinc-700' : 'text-slate-400',
          )}
        />
      </div>
      <span className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-slate-300')}>
        {label}
      </span>
    </button>
  );
}

function OptionPill<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-neutral-border bg-background-dark p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-primary/20 text-primary'
              : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AppearancePanel() {
  // Lazy initializers read from localStorage once on first render,
  // avoiding the React 19 lint error for setState inside useEffect.
  const [theme, setTheme] = useState<ThemeMode>(() => loadStoredPreferences().theme ?? DEFAULTS.theme);
  const [accent, setAccent] = useState<AccentColor>(() => loadStoredPreferences().accent ?? DEFAULTS.accent);
  const [density, setDensity] = useState<SidebarDensity>(() => loadStoredPreferences().density ?? DEFAULTS.density);
  const [fontSize, setFontSize] = useState<FontSize>(() => loadStoredPreferences().fontSize ?? DEFAULTS.fontSize);
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => loadStoredPreferences().dateFormat ?? DEFAULTS.dateFormat);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => loadStoredPreferences().timeFormat ?? DEFAULTS.timeFormat);
  const [language, setLanguage] = useState<Language>(() => loadStoredPreferences().language ?? DEFAULTS.language);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    const prefs: AppearancePreferences = {
      theme,
      accent,
      density,
      fontSize,
      dateFormat,
      timeFormat,
      language,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Silently handle quota errors
    }

    setSaving(false);
    setMessage('Appearance preferences saved.');
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReset = useCallback(() => {
    setTheme(DEFAULTS.theme);
    setAccent(DEFAULTS.accent);
    setDensity(DEFAULTS.density);
    setFontSize(DEFAULTS.fontSize);
    setDateFormat(DEFAULTS.dateFormat);
    setTimeFormat(DEFAULTS.timeFormat);
    setLanguage(DEFAULTS.language);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently handle errors
    }

    setMessage('Preferences reset to defaults.');
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const selectedAccent = ACCENT_COLORS.find((c) => c.id === accent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mx-auto max-w-5xl px-8 py-8"
    >
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Appearance</h1>
        <p className="mt-2 text-sm text-slate-400">
          Personalise the look and feel of the interface. Changes are saved locally until design-token runtime is wired.
        </p>
      </div>

      <div className="space-y-10">
        {/* Theme */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Monitor className="size-4 text-primary" />
              Theme
            </h2>
            <p className="mt-1 text-sm text-slate-500">Choose how the interface looks to you.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ThemeCard mode="dark" label="Dark" icon={Moon} selected={theme === 'dark'} onClick={() => setTheme('dark')} />
            <ThemeCard mode="light" label="Light" icon={Sun} selected={theme === 'light'} onClick={() => setTheme('light')} />
            <ThemeCard mode="system" label="System" icon={Monitor} selected={theme === 'system'} onClick={() => setTheme('system')} />
          </div>
        </section>

        {/* Accent Color */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Accent Color</h2>
            <p className="mt-1 text-sm text-slate-500">Used for buttons, active states, and highlights.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                onClick={() => setAccent(color.id)}
                title={color.label}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                  accent === color.id
                    ? 'border-white/30 bg-white/10 text-slate-100'
                    : 'border-neutral-border bg-neutral-surface/30 text-slate-400 hover:border-neutral-border/80 hover:text-slate-300',
                )}
              >
                <span className={cn('size-3.5 rounded-full', color.cls)} />
                {color.label}
                {accent === color.id && <Check className="size-3.5 text-slate-300" />}
              </button>
            ))}
          </div>
          {selectedAccent && (
            <div className="flex items-center gap-3 rounded-xl border border-neutral-border/60 bg-neutral-surface/20 px-4 py-3">
              <span className={cn('size-4 rounded-full', selectedAccent.cls)} />
              <p className="text-sm text-slate-400">
                Current accent: <span className="text-slate-200">{selectedAccent.label}</span>
                <span className="ml-2 font-mono text-xs text-slate-500">{selectedAccent.hex}</span>
              </p>
            </div>
          )}
        </section>

        {/* Layout & Density */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Layout &amp; Density</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Sidebar Density</label>
              <OptionPill
                value={density}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ]}
                onChange={setDensity}
              />
              <p className="text-xs text-slate-500">
                {density === 'compact'
                  ? 'Reduced padding — fits more items without scrolling.'
                  : 'Default spacing for easy reading and clicking.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Type className="size-3.5" />
                Font Size
              </label>
              <OptionPill
                value={fontSize}
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                onChange={setFontSize}
              />
              <p className="text-xs text-slate-500">
                {fontSize === 'small' ? '13px base' : fontSize === 'large' ? '16px base' : '14px base (default)'}
              </p>
            </div>
          </div>
        </section>

        {/* Date, Time & Locale */}
        <section className="space-y-6">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
              <Clock className="size-4 text-primary" />
              Date, Time &amp; Language
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as DateFormat[]).map((f) => (
                  <option key={f} value={f} className="bg-background-dark">{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Clock className="size-3.5" />
                Time Format
              </label>
              <OptionPill
                value={timeFormat}
                options={[
                  { value: '12h', label: '12h' },
                  { value: '24h', label: '24h' },
                ]}
                onChange={setTimeFormat}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Globe className="size-3.5" />
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full rounded-md border border-neutral-border bg-background-dark px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-background-dark">{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="space-y-4">
          <div className="border-b border-neutral-border/60 pb-4">
            <h2 className="text-base font-semibold text-slate-200">Preview</h2>
            <p className="mt-1 text-sm text-slate-500">Approximate preview of current settings.</p>
          </div>

          <div
            className={cn(
              'overflow-hidden rounded-xl border',
              theme === 'light'
                ? 'border-zinc-200 bg-zinc-50'
                : 'border-neutral-border bg-zinc-900',
            )}
          >
            {/* Mock header */}
            <div
              className={cn(
                'flex items-center gap-3 border-b px-4 py-3',
                theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-950',
              )}
            >
              <div
                className="size-2.5 rounded-full"
                style={{ backgroundColor: selectedAccent?.hex ?? '#1313ec' }}
              />
              <span className={cn('text-sm font-medium', theme === 'light' ? 'text-zinc-800' : 'text-slate-200')}>
                Linear Precision
              </span>
              <span className={cn('ml-auto text-xs', theme === 'light' ? 'text-zinc-500' : 'text-slate-500')}>
                {timeFormat === '12h' ? '9:41 AM' : '09:41'} &nbsp;·&nbsp; {dateFormat === 'MM/DD/YYYY' ? 'Mar 24, 2026' : dateFormat === 'DD/MM/YYYY' ? '24/03/2026' : '2026-03-24'}
              </span>
            </div>

            {/* Mock content */}
            <div className={cn('flex gap-0', density === 'compact' ? 'p-2' : 'p-4')}>
              <div
                className={cn(
                  'mr-3 rounded-lg border',
                  density === 'compact' ? 'w-36 p-2' : 'w-44 p-3',
                  theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-950',
                )}
              >
                {['Dashboard', 'Projects', 'Tasks'].map((item) => (
                  <div
                    key={item}
                    className={cn(
                      'rounded px-2 text-xs font-medium',
                      density === 'compact' ? 'py-1' : 'py-1.5',
                      item === 'Projects'
                        ? theme === 'light'
                          ? 'text-zinc-900'
                          : 'text-slate-100'
                        : theme === 'light'
                        ? 'text-zinc-500'
                        : 'text-slate-500',
                    )}
                    style={item === 'Projects' ? { color: selectedAccent?.hex } : undefined}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 space-y-2">
                {['Sprint Alpha', 'Design Review', 'Bug Triage'].map((task, i) => (
                  <div
                    key={task}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3',
                      density === 'compact' ? 'py-1.5' : 'py-2',
                      theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-950',
                    )}
                  >
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: i === 0 ? selectedAccent?.hex ?? '#1313ec' : '#6b7280' }}
                    />
                    <span
                      className={cn(
                        'font-medium',
                        fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-sm' : 'text-xs',
                        theme === 'light' ? 'text-zinc-800' : 'text-slate-300',
                      )}
                    >
                      {task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save Bar */}
      <div className="sticky bottom-0 z-20 mt-10 border-t border-neutral-border/60 bg-background-dark/90 px-0 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <AnimatePresence>
            {message ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300"
              >
                <CheckCircle2 className="size-4" />
                {message}
              </motion.div>
            ) : <div />}
          </AnimatePresence>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100',
                saving && 'cursor-not-allowed opacity-60',
              )}
            >
              <RotateCcw className="size-4" />
              Reset to Defaults
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className={cn(
                'flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90',
                saving && 'cursor-not-allowed opacity-60',
              )}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
