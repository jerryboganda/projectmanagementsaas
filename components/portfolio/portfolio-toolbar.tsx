import { Search, Plus, ChevronDown, ListFilter, LayoutGrid, List } from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  groupBy: string;
  onGroupByChange: (g: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (v: 'list' | 'grid') => void;
  goalCount: number;
  onNewGoal: () => void;
}

export function PortfolioToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  groupBy,
  onGroupByChange,
  viewMode,
  onViewModeChange,
  goalCount,
  onNewGoal
}: Props) {
  return (
    <div className="h-14 border-b border-neutral-border bg-neutral-surface/50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search goals, owners, or IDs..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.02] border border-neutral-border pl-9 pr-3 py-1.5 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-600 rounded-sm transition-colors"
          />
        </div>

        <div className="h-4 w-px bg-neutral-border"></div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-3 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">All Status</option>
              <option value="OnTrack" className="bg-background-dark">On Track</option>
              <option value="AtRisk" className="bg-background-dark">At Risk</option>
              <option value="OffTrack" className="bg-background-dark">Off Track</option>
              <option value="Completed" className="bg-background-dark">Completed</option>
              <option value="Cancelled" className="bg-background-dark">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              className="appearance-none bg-white/[0.02] border border-neutral-border pl-3 pr-8 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:border-primary/50 rounded-sm transition-colors cursor-pointer"
            >
              <option value="All" className="bg-background-dark">All Types</option>
              <option value="Objective" className="bg-background-dark">Objective</option>
              <option value="KeyResult" className="bg-background-dark">Key Result</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>

          <div className="h-4 w-px bg-neutral-border mx-1"></div>
          
          <div className="relative flex items-center gap-2">
            <ListFilter className="size-3.5 text-slate-500" />
            <select 
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value)}
              className="appearance-none bg-transparent border-none pl-1 pr-6 py-1.5 text-[13px] text-slate-300 focus:outline-none focus:text-slate-200 rounded-sm transition-colors cursor-pointer font-medium"
            >
              <option value="None" className="bg-background-dark">No Grouping</option>
              <option value="Status" className="bg-background-dark">Group by Status</option>
              <option value="Type" className="bg-background-dark">Group by Type</option>
              <option value="Owner" className="bg-background-dark">Group by Owner</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white/[0.02] border border-neutral-border rounded-sm p-0.5">
          <button 
            onClick={() => onViewModeChange('list')}
            className={`p-1 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white/[0.08] text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="size-4" />
          </button>
          <button 
            onClick={() => onViewModeChange('grid')}
            className={`p-1 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white/[0.08] text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-border mx-1"></div>

          <span className="text-[12px] text-slate-500 font-mono">
          {goalCount} {goalCount === 1 ? 'goal' : 'goals'}
        </span>
        <button onClick={onNewGoal} className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 rounded-sm transition-colors">
          <Plus className="size-[16px]" />
          <span className="text-[12px] font-medium">New Goal</span>
        </button>
      </div>
    </div>
  );
}
