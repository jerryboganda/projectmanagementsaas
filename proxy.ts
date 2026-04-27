import { NextResponse, type NextRequest } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
const signalrOrigin = originOf(process.env.NEXT_PUBLIC_SIGNALR_BASE_URL) ?? apiOrigin;

function buildConnectSrc(): string[] {
  const sources = ["'self'", 'https://static.cloudflareinsights.com'];
  if (apiOrigin) sources.push(apiOrigin);
  if (signalrOrigin && signalrOrigin !== apiOrigin) sources.push(signalrOrigin);
  for (const o of [apiOrigin, signalrOrigin]) {
    if (!o) continue;
    const ws = o.replace(/^http/, 'ws');
    if (!sources.includes(ws)) sources.push(ws);
  }
  if (isDev) {
    sources.push('ws://localhost:*', 'http://localhost:*');
  }
  return sources;
}

const connectSrc = buildConnectSrc().join(' ');

export function proxy(request: NextRequest) {
  // F-15 — Per-request nonce CSP. Generates a 128-bit random nonce, attaches it
  // to the request CSP header so Next.js can nonce generated inline scripts, and
  // writes the same policy into the response header for the browser to enforce.
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  let nonceB64 = '';
  for (const b of nonceBytes) nonceB64 += String.fromCharCode(b);
  const nonce = btoa(nonceB64);

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://picsum.photos data: blob:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspDirectives);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('X-Request-Id', crypto.randomUUID());
  response.headers.set('X-Rate-Limit-Policy', 'standard');
  response.headers.set('Content-Security-Policy', cspDirectives);

  return response;
}

export const config = {
  // Skip static assets, the API health route, and Next prefetch RSC fetches
  // (those don't render scripts and don't need a nonce).
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|api/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
