import type { BoardTask, BoardUser } from "@/components/board/types";
import { MessageSquare, Paperclip, CheckSquare, Clock, MoreHorizontal, Zap, BookOpen, Layers, Circle } from "lucide-react";
import Image from "next/image";
import { Draggable } from "@hello-pangea/dnd";

interface Props {
  task: BoardTask;
  assignee?: BoardUser;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  isDragDisabled?: boolean;
  isBulkSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

function TaskTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "bug":
      return <Circle className="size-3 text-rose-500 fill-rose-500" />;
    case "feature":
      return <Zap className="size-3 text-purple-400" />;
    case "story":
      return <BookOpen className="size-3 text-blue-400" />;
    case "epic":
      return <Layers className="size-3 text-amber-400" />;
    default:
      return <Circle className="size-3 text-slate-500" />;
  }
}

export function TaskCard({ task, assignee, index, isSelected, onClick, isDragDisabled = false, isBulkSelected = false, onToggleSelect }: Props) {
  const subtasksTotal = task.checklistTotal;
  const subtasksCompleted = task.checklistCompleted;
  const commentsCount = task.commentCount;
  const attachmentsCount = task.attachmentCount;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'High': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Low': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(task.id);
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={task.title}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          className={`
            group relative bg-neutral-surface border rounded-lg p-3.5 cursor-grab active:cursor-grabbing transition-all duration-200
            hover:bg-white/[0.03] hover:border-neutral-border-hover
            ${isSelected ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'border-neutral-border'}
            ${isBulkSelected ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30' : ''}
            ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] rotate-1 z-50 border-primary/30 bg-neutral-surface/90 backdrop-blur-sm' : ''}
          `}
          style={provided.draggableProps.style}
        >
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <div
              className={`absolute top-2 left-2 z-10 transition-opacity duration-150 ${
                isBulkSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                onClick={handleCheckboxClick}
                className={`size-4 rounded border flex items-center justify-center transition-all ${
                  isBulkSelected
                    ? 'bg-primary border-primary text-white'
                    : 'border-slate-500 hover:border-primary bg-neutral-surface/80'
                }`}
              >
                {isBulkSelected && (
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Header */}
          <div className={`flex items-start justify-between mb-2 gap-2 ${onToggleSelect ? 'pl-5' : ''}`}>
            <div className="flex flex-wrap gap-1.5 flex-1 items-center">
              <TaskTypeIcon type={task.type} />
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-white/[0.03] rounded border border-white/[0.05]">
                {task.identifier}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          {/* Title */}
          <h4 className={`text-[13px] font-medium text-slate-200 mb-2 leading-snug group-hover:text-primary transition-colors ${onToggleSelect ? 'pl-5' : ''}`}>
            {task.title}
          </h4>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className={`flex flex-wrap gap-1 mb-3 ${onToggleSelect ? 'pl-5' : ''}`}>
              {task.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-white/[0.02] border border-white/[0.05] rounded-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-border/50">
            <div className="flex items-center gap-2.5 text-slate-500">
              {subtasksTotal > 0 && (
                <div className={`flex items-center gap-1 text-[11px] ${subtasksCompleted === subtasksTotal ? 'text-emerald-500' : ''}`}>
                  <CheckSquare className="size-3.5" />
                  <span>{subtasksCompleted}/{subtasksTotal}</span>
                </div>
              )}
              {commentsCount > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <MessageSquare className="size-3.5" />
                  <span>{commentsCount}</span>
                </div>
              )}
              {attachmentsCount > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <Paperclip className="size-3.5" />
                  <span>{attachmentsCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                  <Clock className="size-3" />
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              
              {assignee ? (
                <div className="relative size-5 rounded-full overflow-hidden border border-neutral-border bg-neutral-surface flex items-center justify-center shrink-0">
                  {assignee.avatar ? (
                    <Image 
                      src={assignee.avatar} 
                      alt={assignee.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[8px] font-medium text-slate-400">{assignee.initials}</span>
                  )}
                </div>
              ) : (
                <div className="relative size-5 rounded-full border border-dashed border-neutral-border flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-slate-500">?</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
