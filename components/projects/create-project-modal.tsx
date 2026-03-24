"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Calendar, FileText, Hash, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { projectsListQueryKey } from "@/hooks/use-projects-data";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import {
  buildProjectIdentifier,
  toCreateProjectRequest,
  type ProjectCreateInput,
  type ProjectSurfaceStatus,
} from "@/lib/projects/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
}

const statusOptions: ProjectSurfaceStatus[] = [
  "Planning",
  "In Progress",
  "Paused",
  "Completed",
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const queryClient = useQueryClient();
  const { apiClient, session } = useAuth();
  const { toast } = useToast();
  const activeWorkspaceId = session?.activeWorkspaceId ?? null;

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectSurfaceStatus>("Planning");
  const [dueDate, setDueDate] = useState("");
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (identifierTouched) {
      return;
    }

    setIdentifier(buildProjectIdentifier(name));
  }, [identifierTouched, name]);

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setDescription("");
    setStatus("Planning");
    setDueDate("");
    setIdentifierTouched(false);
    setIsSubmitting(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedIdentifier = identifier.trim().toUpperCase();

    if (!trimmedName) {
      return;
    }

    const payload: ProjectCreateInput = {
      name: trimmedName,
      identifier: trimmedIdentifier || buildProjectIdentifier(trimmedName),
      description,
      status,
      dueDate,
    };

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.createProject(toCreateProjectRequest(payload, session?.user.id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsListQueryKey(activeWorkspaceId) }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);

      toast({
        type: "success",
        title: "Project created",
        message: `${trimmedName} is ready for your workspace.`,
      });

      onCreate();
      resetForm();
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "The project could not be created. Please review the form and try again.",
      );
      setErrorMessage(message);
      toast({
        type: "error",
        title: "Project creation failed",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-9 w-full rounded-sm border border-neutral-border bg-white/[0.03] px-3 text-[13px] text-slate-200 transition-colors placeholder:text-slate-500 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none";
  const labelClass = "mb-1.5 block text-[12px] font-medium text-slate-400";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 rounded-sm border border-neutral-border px-3 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || isSubmitting}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-sm border border-primary bg-primary px-4 text-[12px] font-medium text-white transition-colors",
              name.trim() && !isSubmitting ? "hover:bg-primary/90" : "cursor-not-allowed opacity-40",
            )}
          >
            <Plus className="size-3.5" />
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Project Name <span className="text-red-400">*</span>
          </label>
          <div className="group relative">
            <FileText className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Platform Reliability Refresh"
              className={cn(inputClass, "pl-8")}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Identifier <span className="text-red-400">*</span>
          </label>
          <div className="group relative">
            <Hash className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              value={identifier}
              onChange={(event) => {
                setIdentifierTouched(true);
                setIdentifier(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
              placeholder="e.g. PRR"
              maxLength={10}
              className={cn(inputClass, "pl-8 font-mono uppercase tracking-wider")}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Use 2-10 uppercase letters or numbers, starting with a letter.
          </p>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly describe the project outcome and scope."
            rows={3}
            className="w-full resize-none rounded-sm border border-neutral-border bg-white/[0.03] px-3 py-2 text-[13px] text-slate-200 transition-colors placeholder:text-slate-500 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Status</label>
            <div className="group relative">
              <Activity className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ProjectSurfaceStatus)}
                className={cn(inputClass, "cursor-pointer appearance-none pl-8")}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option} className="bg-neutral-surface">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Due Date</label>
            <div className="group relative">
              <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={cn(inputClass, "cursor-pointer pl-8")}
              />
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-sm border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
