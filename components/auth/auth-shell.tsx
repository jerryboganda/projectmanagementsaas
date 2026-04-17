"use client";

import Link from "next/link";
import { Activity } from "lucide-react";

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_34%)]" />
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

              <div className="mt-10 grid gap-3 text-[13px] text-slate-500 md:max-w-md">
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  Launch-ready auth now uses secure cookie bootstrap plus in-memory access state.
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
                  Workspace selection and invitation acceptance are both first-class runtime flows.
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
