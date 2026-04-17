import { Search } from 'lucide-react';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-[#1A1A1A]">
      <div className="flex items-center gap-2 px-3 h-9 bg-[#111] rounded-[4px] border border-[#1A1A1A]">
        <Search className="w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[13px] text-slate-200 placeholder:text-slate-600 outline-none"
        />
      </div>
    </div>
  );
}
