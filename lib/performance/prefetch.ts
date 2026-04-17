"use client";

import { useEffect } from "react";

const PREFETCH_ROUTES = [
  "/board",
  "/projects",
  "/inbox",
  "/calendar",
  "/goals",
  "/sprints",
  "/timeline",
  "/reports",
] as const;

type PrefetchRoute = (typeof PREFETCH_ROUTES)[number];

const ADJACENCY_MAP: Record<string, PrefetchRoute[]> = {
  "/": ["/board", "/projects", "/inbox"],
  "/board": ["/projects", "/sprints"],
  "/projects": ["/board", "/goals"],
  "/inbox": ["/board", "/calendar"],
  "/calendar": ["/timeline", "/board"],
  "/goals": ["/projects", "/reports"],
  "/sprints": ["/board", "/timeline"],
  "/timeline": ["/sprints", "/calendar"],
  "/reports": ["/goals", "/projects"],
};

const prefetchedPaths = new Set<string>();

function requestIdleCallbackShim(cb: () => void): void {
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(cb);
  } else {
    setTimeout(cb, 1);
  }
}

function injectPrefetchLink(path: string): void {
  if (typeof document === "undefined") return;
  if (prefetchedPaths.has(path)) return;

  // Guard against duplicates already in the DOM
  const existing = document.querySelector(`link[rel="prefetch"][href="${path}"]`);
  if (existing) {
    prefetchedPaths.add(path);
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.appendChild(link);
  prefetchedPaths.add(path);
}

export function prefetchAdjacentRoutes(currentPath: string): void {
  // Normalise: strip trailing slash, match base segment
  const base = "/" + (currentPath.split("/").filter(Boolean)[0] ?? "");
  const key = base === "/" ? "/" : base;
  const targets = ADJACENCY_MAP[key];

  if (!targets || targets.length === 0) return;

  requestIdleCallbackShim(() => {
    for (const route of targets) {
      if (route !== currentPath) {
        injectPrefetchLink(route);
      }
    }
  });
}

export function usePrefetchRoutes(currentPath: string): void {
  useEffect(() => {
    prefetchAdjacentRoutes(currentPath);
  }, [currentPath]);
}
