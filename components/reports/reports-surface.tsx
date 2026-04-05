'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Wallet,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportData, KPIMetric, ReportProject, KPI_DESCRIPTIONS, type PlannedReportId } from './data';

interface ReportsSurfaceProps {
  report: ReportData;
  onSelectProject: (project: ReportProject) => void;
  selectedProjectId?: string;
}

interface ComingSoonSurfaceProps {
  reportId: PlannedReportId;
}

export function ComingSoonSurface({ reportId }: ComingSoonSurfaceProps) {
  const config: Record<PlannedReportId, { title: string; description: string; icon: typeof Target }> = {
    goals: {
      title: 'Goals Report',
      description: 'Track progress toward team and organizational objectives. Goal alignment, completion rates, and milestone tracking will be available here once the goals module ships.',
      icon: Target,
    },
    financial: {
      title: 'Financial Report',
      description: 'Monitor project budgets, cost tracking, and resource allocation spend. Financial analytics will be available here once the billing and budget modules are integrated.',
      icon: Wallet,
    },
  };

  const { title, description, icon: Icon } = config[reportId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex-1 flex items-center justify-center p-6"
    >
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Icon className="size-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-slate-100 mb-3">{title}</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">{description}</p>
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
          <Rocket className="w-4 h-4" />
          Coming Soon
        </div>
      </div>
    </motion.div>
  );
}

export function ReportsSurface({ report, onSelectProject, selectedProjectId }: ReportsSurfaceProps) {
  const [hoveredKpiId, setHoveredKpiId] = useState<string | null>(null);

  const renderTrendIcon = (metric: KPIMetric) => {
    if (metric.trend.direction === 'up') return <ArrowUpRight className="w-3.5 h-3.5" />;
    if (metric.trend.direction === 'down') return <ArrowDownRight className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const renderTrendColor = (metric: KPIMetric) => {
    if (metric.trend.sentiment === 'positive') return 'text-emerald-400 bg-emerald-400/10';
    if (metric.trend.sentiment === 'negative') return 'text-rose-400 bg-rose-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  const formatValue = (value: string | number, format?: string) => {
    if (format === 'percentage') return `${value}%`;
    if (format === 'currency') return `$${value}`;
    return value;
  };

  const renderChart = () => {
    if (!report.chartData || report.chartData.length === 0) return null;

    if (report.id === 'project-health') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={report.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="completed" name="Completed Tasks" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="added" name="Added Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="monotone" dataKey="atRisk" name="At Risk Projects" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (report.id === 'team-velocity') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={report.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area type="monotone" dataKey="capacity" name="Capacity (pts)" fill="#334155" stroke="#475569" fillOpacity={0.3} />
            <Line type="monotone" dataKey="velocity" name="Velocity (pts)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    if (report.id === 'workload') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="assigned" name="Assigned Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
            <Bar dataKey="completed" name="Completed Tasks" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'at-risk': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'off-track': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6"
    >
      {/* Report Description */}
      <div className="mb-2">
        <p className="text-slate-400 text-sm max-w-3xl">{report.description}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {report.kpis.map((kpi, i) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-neutral-surface border border-neutral-border rounded-xl p-5 shadow-sm hover:border-neutral-border/80 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{kpi.label}</h3>
              <div className="relative">
                <button
                  className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseEnter={() => setHoveredKpiId(kpi.id)}
                  onMouseLeave={() => setHoveredKpiId(null)}
                >
                  <Info className="w-4 h-4" />
                </button>
                {hoveredKpiId === kpi.id && KPI_DESCRIPTIONS[kpi.id] && (
                  <div className="absolute right-0 top-full mt-2 w-64 max-w-xs rounded-lg border border-neutral-border bg-neutral-surface p-3 shadow-xl z-50">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {KPI_DESCRIPTIONS[kpi.id]}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-slate-100 tracking-tight">
                {formatValue(kpi.value, kpi.format)}
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", renderTrendColor(kpi))}>
                {renderTrendIcon(kpi)}
                {kpi.trend.value}
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {kpi.trend.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Chart Area */}
      {report.chartData && report.chartData.length > 0 && (
        <div className="bg-neutral-surface border border-neutral-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-200">Trend Analysis</h3>
            <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full">
            {renderChart()}
          </div>
        </div>
      )}

      {/* Data Table Area */}
      {report.projects && report.projects.length > 0 && (
        <div className="bg-neutral-surface border border-neutral-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-border/50">
            <h3 className="text-base font-semibold text-slate-200">Contributing Projects</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{report.projects.length} projects</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background-dark/50 text-slate-400 border-b border-neutral-border/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Project Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Health Score</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border/50">
                {report.projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className={cn(
                      "group cursor-pointer transition-colors",
                      selectedProjectId === project.id
                        ? 'bg-primary/5'
                        : 'hover:bg-white/5'
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200 group-hover:text-primary transition-colors">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <span className="text-slate-300">{getStatusLabel(project.status)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-1.5 bg-neutral-border rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              project.status === 'at-risk' ? 'bg-amber-500' :
                              project.status === 'off-track' ? 'bg-rose-500' :
                              'bg-emerald-500'
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={cn(
                        "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold",
                        project.healthScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                        project.healthScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-rose-500/10 text-rose-400'
                      )}>
                        {project.healthScore}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {project.owner.avatar ? (
                          <Image src={project.owner.avatar} alt={project.owner.name} width={24} height={24} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                            {project.owner.initials}
                          </div>
                        )}
                        <span className="text-slate-300">{project.owner.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
