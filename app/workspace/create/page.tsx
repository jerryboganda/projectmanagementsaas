"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/api/error-utils";

export default function WorkspaceCreatePage() {
  const router = useRouter();
  const { createWorkspace, setActiveWorkspaceId } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const workspace = await createWorkspace({
        name,
        description: description.trim() ? description : null,
      });
      await setActiveWorkspaceId(workspace.id);
      toast({
        type: "success",
        title: "Workspace created",
        message: `${workspace.name} is now your active workspace.`,
      });
      router.replace("/");
    } catch (submissionError) {
      setError(getApiErrorMessage(submissionError, "Unable to create a workspace."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Workspace"
      title="Create your first workspace"
      description="You need an active workspace before tenant-scoped features like board, inbox, and projects can load."
    >
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-slate-500">
          Workspace Bootstrap
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">
          Name your team space
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-slate-400">
          This creates the workspace and immediately switches your active tenant context into it.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <FormField
          label="Workspace name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Product Operations"
          required
        />
        <FormField
          as="textarea"
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional context for your team, product area, or delivery org."
        />

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating workspace..." : "Create workspace"}
        </button>
      </form>
    </AuthShell>
  );
}
