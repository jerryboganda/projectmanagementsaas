"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import type { BoardTaskPriority, BoardTaskStatus, BoardUser } from "@/components/board/types";
import type { ProjectResponse } from "@/lib/api/contracts";

interface CreateTaskModalProps {
  isOpen: boolean;
  defaultStatus: BoardTaskStatus;
  users: BoardUser[];
  projects: ProjectResponse[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreateTask: (input: {
    projectId: string;
    title: string;
    description?: string;
    status: BoardTaskStatus;
    priority: BoardTaskPriority;
    assigneeId?: string;
    dueDate?: string;
    tags: string[];
  }) => Promise<void>;
}

const PRIORITIES: BoardTaskPriority[] = ["Low", "Medium", "High", "Urgent"];

export function CreateTaskModal({
  isOpen,
  defaultStatus,
  users,
  projects,
  isSubmitting,
  onClose,
  onCreateTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<BoardTaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<BoardTaskPriority>("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize projectId to first available project when modal opens or project list changes.
  useEffect(() => {
    if (isOpen && !projectId && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [isOpen, projectId, projects]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus);
    setPriority("Medium");
    setAssigneeId("");
    setProjectId(projects[0]?.id || "");
    setDueDate("");
    setTagsInput("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!projectId) {
      setError("A project is required because tasks are persisted through the backend.");
      return;
    }

    await onCreateTask({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      tags: tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    });

    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            className="rounded-md border border-neutral-border bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-50 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Title"
          required
          placeholder="Enter task title"
          value={title}
          error={error ?? undefined}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(event.target.value);
            if (error) setError(null);
          }}
        />

        <FormField
          as="textarea"
          label="Description"
          placeholder="Describe the task..."
          value={description}
          rows={3}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Status"
            value={status}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value as BoardTaskStatus)}
          >
            {["To Do", "In Progress", "In Review", "Done"].map((item) => (
              <option key={item} value={item} className="bg-background-dark">
                {item}
              </option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Priority"
            value={priority}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setPriority(event.target.value as BoardTaskPriority)}
          >
            {PRIORITIES.map((item) => (
              <option key={item} value={item} className="bg-background-dark">
                {item}
              </option>
            ))}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Project"
            value={projectId}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setProjectId(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id} className="bg-background-dark">
                {project.name}
              </option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Assignee"
            value={assigneeId}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setAssigneeId(event.target.value)}
          >
            <option value="" className="bg-background-dark">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id} className="bg-background-dark">
                {user.name}
              </option>
            ))}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDueDate(event.target.value)}
          />
          <FormField
            label="Tags"
            placeholder="Design, Frontend, Bug"
            value={tagsInput}
            hint="Separate tags with commas."
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTagsInput(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
