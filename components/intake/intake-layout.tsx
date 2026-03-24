"use client";

import { useCallback, useMemo, useState } from "react";
import type { IntakeFieldSchema } from "@/lib/api/contracts";
import type { IntakeFormSurface, IntakeSubmissionSurface } from "@/components/intake/data";
import { useIntakeData } from "@/hooks/use-intake-data";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Hash,
  Lock,
  Search,
  Send,
  User,
  XCircle,
} from "lucide-react";

type RightPanel = "submissions" | "preview";

const STATUS_CONFIG: Record<
  IntakeSubmissionSurface["status"],
  { label: string; className: string; icon: typeof Clock }
> = {
  new: {
    label: "New",
    className: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20",
    icon: Clock,
  },
  inReview: {
    label: "In Review",
    className: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    icon: Eye,
  },
  accepted: {
    label: "Accepted",
    className: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "text-red-300 bg-red-500/10 border-red-500/20",
    icon: XCircle,
  },
  converted: {
    label: "Converted",
    className: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    icon: ArrowRightLeft,
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: typeof ClipboardList;
  accent: string;
}) {
  return (
    <div className="bg-neutral-surface border border-neutral-border rounded-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-sm ${accent}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[18px] font-semibold text-slate-100">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  users,
  onChange,
}: {
  field: IntakeFieldSchema;
  value: string;
  users: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full bg-background-dark border border-neutral-border rounded-sm px-3 py-2 text-[13px] text-slate-200 focus:outline-none focus:border-primary resize-none"
      />
    );
  }

  if (field.type === "select" || field.type === "priority" || field.type === "assignee") {
    const options =
      field.type === "priority"
        ? ["Urgent", "High", "Medium", "Low", "None"]
        : field.type === "assignee"
          ? users.map((user) => ({ value: user.id, label: user.name }))
          : (field.options ?? []).map((option) => ({ value: option, label: option }));

    return (
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-9 bg-background-dark border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 focus:outline-none focus:border-primary appearance-none"
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {options.map((option) =>
            typeof option === "string" ? (
              <option key={option} value={option}>
                {option}
              </option>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
      </div>
    );
  }

  if (field.type === "date") {
    return (
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-9 bg-background-dark border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
        />
        <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full h-9 bg-background-dark border border-neutral-border rounded-sm px-3 text-[13px] text-slate-200 focus:outline-none focus:border-primary"
    />
  );
}

function SubmissionActions({
  form,
  submission,
  canConvert,
  isBusy,
  onReview,
  onApprove,
  onReject,
  onConvert,
}: {
  form: IntakeFormSurface;
  submission: IntakeSubmissionSurface;
  canConvert: boolean;
  isBusy: boolean;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onConvert: () => void;
}) {
  if (submission.status === "new") {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onReview} disabled={isBusy} className="h-6 px-2 text-[10px] text-blue-400 border border-blue-500/20 bg-blue-500/10 rounded-sm disabled:opacity-40">Review</button>
        <button onClick={onApprove} disabled={isBusy} className="h-6 px-2 text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-sm disabled:opacity-40">Approve</button>
        <button onClick={onReject} disabled={isBusy} className="h-6 px-2 text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 rounded-sm disabled:opacity-40">Reject</button>
      </div>
    );
  }

  if (submission.status === "inReview") {
    return (
      <div className="flex items-center gap-1">
        <button onClick={onApprove} disabled={isBusy} className="h-6 px-2 text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 rounded-sm disabled:opacity-40">Approve</button>
        <button onClick={onReject} disabled={isBusy} className="h-6 px-2 text-[10px] text-red-400 border border-red-500/20 bg-red-500/10 rounded-sm disabled:opacity-40">Reject</button>
      </div>
    );
  }

  if (submission.status === "accepted") {
    return canConvert ? (
      <button onClick={onConvert} disabled={isBusy} className="h-6 px-2 text-[10px] text-blue-400 border border-blue-500/20 bg-blue-500/10 rounded-sm disabled:opacity-40">
        Convert to Task
      </button>
    ) : (
      <span className="text-[11px] text-amber-500">
        {form.projectId ? "Review first" : "Needs default project"}
      </span>
    );
  }

  return <span className="text-[11px] text-slate-600">—</span>;
}

export function IntakeLayout() {
  const {
    canConvertSubmission,
    convertSubmission,
    dependencyWarning,
    error,
    forms,
    getMemberName,
    getProjectName,
    getSubmissionCount,
    getSubmissionsForForm,
    isConverting,
    isLoading,
    isReviewing,
    isSubmitting,
    isWorkspaceReady,
    members,
    reviewSubmission,
    submissions,
    submitRequest,
  } = useIntakeData();

  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("submissions");
  const [search, setSearch] = useState("");
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedForm = useMemo(
    () => (selectedFormId ? forms.find((form) => form.id === selectedFormId) ?? null : forms[0] ?? null),
    [forms, selectedFormId],
  );
  const selectedSubmissions = useMemo(
    () => (selectedForm ? getSubmissionsForForm(selectedForm.id) : []),
    [getSubmissionsForForm, selectedForm],
  );
  const filteredForms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? forms.filter((form) => [form.name, form.description, form.slug].join(" ").toLowerCase().includes(query))
      : forms;
  }, [forms, search]);
  const stats = useMemo(() => {
    const pending = submissions.filter((item) => item.status === "new" || item.status === "inReview").length;
    const converted = submissions.filter((item) => item.status === "converted").length;
    return {
      totalForms: forms.length,
      totalSubmissions: submissions.length,
      pending,
      conversionRate: submissions.length ? Math.round((converted / submissions.length) * 100) : 0,
    };
  }, [forms.length, submissions]);

  const isBusy = isSubmitting || isReviewing || isConverting;
  const previewUsers = members.map((member) => ({ id: member.userId, name: member.fullName }));

  const runAction = useCallback(async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (caughtError) {
      setActionError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    }
  }, []);

  if (!isWorkspaceReady || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="rounded-sm border border-neutral-border bg-neutral-surface/40 p-6 text-center max-w-md">
          <Clock className="size-8 text-primary mx-auto mb-3" />
          <h2 className="text-[16px] font-semibold text-slate-100 mb-2">
            {isWorkspaceReady ? "Loading Intake" : "Workspace Required"}
          </h2>
          <p className="text-[13px] text-slate-500">
            {isWorkspaceReady ? "Pulling live forms and submissions." : "Select an active workspace to load intake."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="rounded-sm border border-red-500/20 bg-red-500/10 p-6 text-center max-w-md">
          <AlertTriangle className="size-8 text-red-300 mx-auto mb-3" />
          <h2 className="text-[16px] font-semibold text-slate-100 mb-2">Intake Unavailable</h2>
          <p className="text-[13px] text-slate-300">{error instanceof Error ? error.message : "The intake surface could not load."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 pt-5 pb-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Active Forms" value={stats.totalForms} icon={ClipboardList} accent="bg-primary/10 text-primary" />
          <StatCard label="Total Submissions" value={stats.totalSubmissions} icon={FileText} accent="bg-blue-500/10 text-blue-400" />
          <StatCard label="Pending Review" value={stats.pending} icon={Clock} accent="bg-yellow-500/10 text-yellow-400" />
          <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} icon={BarChart3} accent="bg-emerald-500/10 text-emerald-400" />
        </div>
        {dependencyWarning ? <div className="mt-3 rounded-sm border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">{dependencyWarning}</div> : null}
        {actionError ? <div className="mt-3 rounded-sm border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">{actionError}</div> : null}
      </div>

      <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-4">
        <aside className="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-neutral-surface/30 border border-neutral-border rounded-sm overflow-hidden">
          <div className="p-3 border-b border-neutral-border/50 space-y-3">
            <h3 className="text-[13px] font-semibold text-slate-200">Forms <span className="text-[11px] text-slate-500 font-normal">({forms.length})</span></h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search forms..." className="w-full h-8 pl-8 pr-3 bg-background-dark border border-neutral-border rounded-sm text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredForms.map((form) => (
              <button key={form.id} onClick={() => { setSelectedFormId(form.id); setRightPanel("submissions"); setActionError(null); }} className={`w-full text-left p-4 rounded-sm border ${selectedForm?.id === form.id ? "bg-white/5 border-primary/40" : "bg-neutral-surface border-neutral-border hover:border-slate-600"}`}>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-sm mt-0.5"><ClipboardList className="size-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-semibold text-slate-100 truncate">{form.name}</h4>
                      <span className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${form.isPublic ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-800/50 border-neutral-border/60"}`}>{form.isPublic ? <Globe className="size-2.5" /> : <Lock className="size-2.5" />}{form.isPublic ? "Public" : "Private"}</span>
                    </div>
                    <p className="text-[12px] text-slate-500 line-clamp-1 mb-2">{form.description || "No description provided."}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><FileText className="size-3" />{form.fields.length} fields</span>
                      <span className="flex items-center gap-1"><Hash className="size-3" />{getSubmissionCount(form.id)} submissions</span>
                      {form.projectId ? <span className="flex items-center gap-1 text-slate-600"><FolderOpen className="size-3" />{getProjectName(form.projectId)}</span> : <span className="flex items-center gap-1 text-amber-500/80"><AlertTriangle className="size-3" />Needs project</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filteredForms.length === 0 ? <div className="py-10 text-center text-[12px] text-slate-500">No active forms match this search.</div> : null}
          </div>
        </aside>

        <section className="flex-1 bg-neutral-surface/30 border border-neutral-border rounded-sm overflow-hidden flex flex-col min-w-0">
          {!selectedForm ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ClipboardList className="size-8 text-primary mb-4" />
              <h3 className="text-[15px] font-semibold text-slate-200 mb-1">Select a Form</h3>
              <p className="text-[13px] text-slate-500 max-w-sm">Choose an intake form to review live submissions or preview the public form.</p>
            </div>
          ) : rightPanel === "preview" ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
                <div><h3 className="text-[14px] font-semibold text-slate-100">Form Preview</h3><p className="text-[11px] text-slate-500">{selectedForm.name}</p></div>
                <button onClick={() => setRightPanel("submissions")} className="text-slate-500 hover:text-slate-300">Back</button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {selectedForm.fields.length === 0 ? <div className="rounded-sm border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] text-amber-200">This form does not expose any field schema yet.</div> : null}
                {selectedForm.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">{field.label}{field.required ? <span className="text-red-400 ml-0.5">*</span> : null}</label>
                    <FieldInput field={field} value={previewValues[field.label] ?? ""} users={previewUsers} onChange={(value) => setPreviewValues((current) => ({ ...current, [field.label]: value }))} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-border">
                <button onClick={() => setRightPanel("submissions")} className="h-8 px-4 text-[12px] text-slate-400 border border-neutral-border rounded-sm">Cancel</button>
                <button
                  onClick={() => {
                    const missingRequiredField = selectedForm.fields.some(
                      (field) => field.required && !previewValues[field.label]?.trim(),
                    );

                    if (missingRequiredField) {
                      setActionError("Please complete all required fields before submitting.");
                      return;
                    }

                    void runAction(async () => {
                      await submitRequest(selectedForm, previewValues);
                      setPreviewValues({});
                      setRightPanel("submissions");
                    });
                  }}
                  disabled={isSubmitting || selectedForm.fields.length === 0}
                  className="h-8 px-4 text-[12px] text-white bg-primary rounded-sm disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="size-3.5" />
                  Submit Request
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-100">{selectedForm.name}</h3>
                  <p className="text-[11px] text-slate-500">{selectedSubmissions.length} submission{selectedSubmissions.length === 1 ? "" : "s"}</p>
                </div>
                <button onClick={() => setRightPanel("preview")} className="h-7 px-2.5 text-[11px] text-primary border border-primary/30 rounded-sm flex items-center gap-1"><Eye className="size-3" />Preview</button>
              </div>
              <div className="flex-1 overflow-auto">
                {selectedSubmissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="size-6 text-slate-600 mb-3" />
                    <h4 className="text-[13px] font-medium text-slate-300 mb-1">No submissions yet</h4>
                    <p className="text-[12px] text-slate-500 mb-4">Preview the live form and submit a test request to populate this table.</p>
                    <button onClick={() => setRightPanel("preview")} className="h-8 px-4 text-[12px] text-white bg-primary rounded-sm">Preview & Submit</button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neutral-border bg-neutral-surface/50">
                        <th className="text-left py-2.5 px-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Submitter</th>
                        {selectedForm.fields.slice(0, 2).map((field) => <th key={field.id} className="text-left py-2.5 px-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">{field.label}</th>)}
                        {selectedForm.fields.length < 2 ? <th className="py-2.5 px-4" /> : null}
                        <th className="text-left py-2.5 px-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-left py-2.5 px-4 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubmissions.map((submission) => {
                        const config = STATUS_CONFIG[submission.status];
                        const StatusIcon = config.icon;
                        return (
                          <tr key={submission.id} className="border-b border-neutral-border/40 hover:bg-white/[0.02]">
                            <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="size-6 bg-slate-800 border border-neutral-border rounded-sm flex items-center justify-center"><User className="size-3 text-slate-500" /></div><span className="text-[12px] text-slate-300 truncate max-w-[160px]">{getMemberName(submission.submitterUserId, submission.submitterEmail)}</span></div></td>
                            {selectedForm.fields.slice(0, 2).map((field) => <td key={field.id} className="py-3 px-4 text-[12px] text-slate-300 truncate max-w-[180px]">{submission.values[field.label] || "—"}</td>)}
                            {selectedForm.fields.length < 2 ? <td className="py-3 px-4" /> : null}
                            <td className="py-3 px-4"><span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-sm border ${config.className}`}><StatusIcon className="size-3" />{config.label}</span></td>
                            <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">{formatDate(submission.submittedAt)}</td>
                            <td className="py-3 px-4">
                              <SubmissionActions
                                form={selectedForm}
                                submission={submission}
                                canConvert={canConvertSubmission(selectedForm, submission)}
                                isBusy={isBusy}
                                onReview={() => void runAction(() => reviewSubmission(submission.id, "inReview"))}
                                onApprove={() => void runAction(() => reviewSubmission(submission.id, "accepted"))}
                                onReject={() => void runAction(() => reviewSubmission(submission.id, "rejected"))}
                                onConvert={() => void runAction(() => convertSubmission(selectedForm, submission))}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
