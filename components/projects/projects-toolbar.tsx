import { Search, LayoutGrid, List, Plus, Filter, ArrowUpDown } from "lucide-react";
import { ViewMode } from "./projects-layout";

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  projectCount: number;
  onNewProject: () => void;
}

export function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  projectCount,
  onNewProject
}: Props) {
  return (
    <div className="h-14 border-b border-neutral-border flex items-center justify-between px-6 flex-shrink-0 bg-neutral-surface/50 backdrop-blur-sm z-10">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-64 bg-white/[0.03] border border-neutral-border pl-9 pr-3 text-[13px] text-slate-200 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] placeholder:text-slate-500 rounded-sm transition-colors"
          />
        </div>
        
        <div className="h-4 w-px bg-neutral-border hidden sm:block" />
        
        <div className="hidden sm:flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-8 bg-transparent border border-transparent hover:border-neutral-border hover:bg-white/5 text-[13px] text-slate-300 focus:outline-none rounded-sm px-2 cursor-pointer transition-colors"
          >
            <option value="All" className="bg-background-dark">All Statuses</option>
            <option value="Planning" className="bg-background-dark">Planning</option>
            <option value="In Progress" className="bg-background-dark">In Progress</option>
            <option value="Paused" className="bg-background-dark">Paused</option>
            <option value="Completed" className="bg-background-dark">Completed</option>
          </select>
          
          <button className="h-8 px-2 border border-transparent hover:border-neutral-border hover:bg-white/5 rounded-sm transition-colors flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
            <Filter className="size-3.5" />
            <span className="text-[13px] font-medium">Filter</span>
          </button>
          
          <button className="h-8 px-2 border border-transparent hover:border-neutral-border hover:bg-white/5 rounded-sm transition-colors flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
            <ArrowUpDown className="size-3.5" />
            <span className="text-[13px] font-medium">Sort</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-[12px] font-mono text-slate-500 hidden md:block">
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </div>
        
        <div className="flex items-center bg-black/20 p-0.5 rounded-sm border border-neutral-border">
          <button 
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-neutral-surface text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            title="List view"
          >
            <List className="size-3.5" />
          </button>
          <button 
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-neutral-surface text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            title="Grid view"
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>

        <button onClick={onNewProject} className="h-8 px-3 border border-primary bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5 rounded-sm transition-colors">
          <Plus className="size-4" />
          <span className="text-[12px] font-medium hidden sm:inline">New Project</span>
        </button>
      </div>
    </div>
  );
}
