"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import type { GoalCreateInput, GoalSurfaceStatus, GoalSurfaceType } from "@/components/goals/data";
import { cn } from "@/lib/utils";

interface GoalOwnerOption {
  id: string;
  label: string;
}

interface GoalParentOption {
  id: string;
  title: string;
}

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: GoalCreateInput) => Promise<void>;
  owners: GoalOwnerOption[];
  goals: GoalParentOption[];
  isSubmitting?: boolean;
  defaultOwnerId?: string | null;
  defaultParentGoalId?: string | null;
}

const goalTypes = [
  { value: "Objective", label: "Objective" },
  { value: "KeyResult", label: "Key Result" },
] satisfies ReadonlyArray<{ value: GoalSurfaceType; label: string }>;

const goalStatuses = [
  { value: "OnTrack", label: "On Track" },
  { value: "AtRisk", label: "At Risk" },
  { value: "OffTrack", label: "Off Track" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] satisfies ReadonlyArray<{ value: GoalSurfaceStatus; label: string }>;

export function CreateGoalModal({
  isOpen,
  onClose,
  onCreate,
  owners,
  goals,
  isSubmitting = false,
  defaultOwnerId,
  defaultParentGoalId,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalSurfaceType>("Objective");
  const [status, setStatus] = useState<GoalSurfaceStatus>("OnTrack");
  const [progressPercent, setProgressPercent] = useState("0");
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? "");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [parentGoalId, setParentGoalId] = useState(defaultParentGoalId ?? "");
  const [titleError, setTitleError] = useState("");

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setType("Objective");
    setStatus("OnTrack");
    setProgressPercent("0");
    setOwnerId(defaultOwnerId ?? "");
    setStartDate("");
    setTargetDate("");
    setParentGoalId(defaultParentGoalId ?? "");
    setTitleError("");
  }, [defaultOwnerId, defaultParentGoalId]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }

    await onCreate({
      title: title.trim(),
      description: description.trim() || null,
      type,
      status,
      progressPercent: Number.parseInt(progressPercent, 10) || 0,
      ownerId: ownerId || null,
      startDate: startDate || null,
      targetDate: targetDate || null,
      parentGoalId: parentGoalId || null,
    });

    resetForm();
  }, [
    description,
    onCreate,
    ownerId,
    parentGoalId,
    progressPercent,
    resetForm,
    startDate,
    status,
    targetDate,
    title,
    type,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={defaultParentGoalId ? "Create Sub-goal" : "Create Goal"}
      size="lg"
      footer={
        <>
          <button
            onClick={handleClose}
            className="h-8 px-4 text-[13px] font-medium text-slate-300 hover:text-slate-100 bg-white/[0.04] hover:bg-white/[0.08] border border-neutral-border rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={isSubmitting}
            className={cn(
              "h-8 px-4 text-[13px] font-medium text-white bg-primary hover:bg-primary/90 border border-primary rounded-sm transition-colors flex items-center gap-2",
              isSubmitting && "opacity-60 cursor-not-allowed",
            )}
          >
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {defaultParentGoalId ? "Create Sub-goal" : "Create Goal"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField
          label="Title"
          required
          placeholder="Enter goal title"
          value={title}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setTitle(event.target.value);
            if (event.target.value.trim()) {
              setTitleError("");
            }
          }}
          error={titleError}
        />

        <FormField
          as="textarea"
          label="Description"
          placeholder="Describe the goal..."
          value={description}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Type"
            value={type}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setType(event.target.value as GoalSurfaceType)
            }
          >
            {goalTypes.map((goalType) => (
              <option key={goalType.value} value={goalType.value} className="bg-background-dark">
                {goalType.label}
              </option>
            ))}
          </FormField>

          <FormField
            as="select"
            label="Status"
            value={status}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setStatus(event.target.value as GoalSurfaceStatus)
            }
          >
            {goalStatuses.map((goalStatus) => (
              <option key={goalStatus.value} value={goalStatus.value} className="bg-background-dark">
                {goalStatus.label}
              </option>
            ))}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            as="select"
            label="Owner"
            value={ownerId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setOwnerId(event.target.value)}
          >
            <option value="" className="bg-background-dark">
              Unassigned
            </option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id} className="bg-background-dark">
                {owner.label}
              </option>
            ))}
          </FormField>

          <FormField
            label="Progress"
            type="number"
            min={0}
            max={100}
            value={progressPercent}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setProgressPercent(event.target.value)}
            hint="Percent complete"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setStartDate(event.target.value)}
          />

          <FormField
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setTargetDate(event.target.value)}
          />
        </div>

        <FormField
          as="select"
          label="Parent Goal"
          value={parentGoalId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setParentGoalId(event.target.value)}
        >
          <option value="" className="bg-background-dark">
            No parent goal
          </option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id} className="bg-background-dark">
              {goal.title}
            </option>
          ))}
        </FormField>
      </div>
    </Modal>
  );
}
