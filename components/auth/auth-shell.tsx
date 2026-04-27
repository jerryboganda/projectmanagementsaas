"use client";

import Link from "next/link";
import { Activity, ListChecks, ShieldCheck, Users } from "lucide-react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main id="main-content" className="flex-1 min-h-screen bg-background-dark relative overflow-y-auto">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,99,235,0.08),transparent_42%,rgba(16,185,129,0.06))]" />
      <div className="relative min-h-screen px-6 py-10 md:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <div className="grid w-full gap-8 rounded-[28px] border border-neutral-border bg-neutral-surface/80 p-6 shadow-2xl backdrop-blur-xl md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <section className="flex flex-col justify-between rounded-[24px] border border-white/5 bg-[linear-gradient(160deg,rgba(15,23,42,0.94),rgba(17,24,39,0.82))] p-8">
              <div>
                <Link href="/" className="inline-flex items-center gap-3 text-slate-100">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    <Activity className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold tracking-tight">Linear Precision</span>
                    <span className="block text-[11px] font-mono uppercase tracking-[0.28em] text-slate-500">
                      {eyebrow}
                    </span>
                  </span>
                </Link>
                <h1 className="mt-10 max-w-md text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-400">
                  {description}
                </p>
              </div>

              <div className="mt-10 space-y-5 md:max-w-md">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <ListChecks className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Plan the right work</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500">
                      Turn requests into prioritized projects, tasks, and sprint plans your team can act on.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                    <Users className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Keep teams aligned</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500">
                      Share owners, deadlines, docs, and updates from one workspace instead of chasing context.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
                    <ShieldCheck className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">Access stays focused</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500">
                      Secure sign-in and workspace access help each person return to the projects they need.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-neutral-border bg-background-dark/70 p-6 md:p-8">
              {children}
              {footer ? <div className="mt-6 border-t border-neutral-border pt-5">{footer}</div> : null}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
