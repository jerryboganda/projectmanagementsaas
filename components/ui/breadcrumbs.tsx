"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Map route segments to display labels
const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  "board": "Board",
  "projects": "Projects",
  "portfolio": "Portfolio",
  "goals": "Goals",
  "calendar": "Calendar",
  "timeline": "Timeline",
  "workload": "Workload",
  "docs": "Documents",
  "reports": "Reports",
  "settings": "Settings",
  "inbox": "Inbox",
  "sprints": "Sprint Planning",
  "automations": "Automations",
  "time-tracking": "Time Tracking",
  "intake": "Request Intake",
  "templates": "Templates",
};

interface BreadcrumbsProps {
  /** Optional extra crumbs appended after the route-based ones */
  extra?: { label: string; href?: string }[];
}

export function Breadcrumbs({ extra }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build crumbs from path segments
  const crumbs: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
  ];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href: currentPath });
  }

  // Add extra crumbs if provided
  if (extra) {
    for (const e of extra) {
      crumbs.push({ label: e.label, href: e.href || "#" });
    }
  }

  // Don't render if we're at root with no extra crumbs
  if (crumbs.length <= 1 && !extra?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-6 py-2 text-[12px] border-b border-neutral-border/50 bg-neutral-surface/30">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href + i} className="flex items-center gap-1">
            {i === 0 ? (
              <Home className="size-3 text-slate-500" />
            ) : (
              <ChevronRight className="size-3 text-slate-600" />
            )}
            {isLast ? (
              <span className="text-slate-300 font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
