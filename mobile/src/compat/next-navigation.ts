import { useLocation, useNavigate, useParams, useSearchParams as useRRSearchParams } from 'react-router-dom';

/**
 * next/navigation shim for the Capacitor/Vite mobile bundle.
 * Re-implements the subset of Next.js App Router navigation hooks
 * used by shared components, backed by react-router-dom.
 */

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
      // In WebView we can't truly "refresh" — consumers should rely on
      // TanStack Query invalidation. No-op is safe.
    },
    prefetch: (_href: string) => {
      // Prefetch is a no-op in the mobile bundle.
    },
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [params] = useRRSearchParams();
  return params;
}

export { useParams };

export function redirect(href: string): never {
  // Best-effort client-side redirect; server semantics do not apply on mobile.
  if (typeof window !== 'undefined') {
    window.location.assign(href);
  }
  throw new Error(`NEXT_REDIRECT:${href}`);
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
