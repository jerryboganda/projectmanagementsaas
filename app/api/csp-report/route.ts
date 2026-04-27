import { NextResponse, type NextRequest } from "next/server";

/**
 * F-15 — CSP violation report endpoint. Browsers POST a JSON document to this
 * URL whenever the Content-Security-Policy emitted by `proxy.ts` blocks
 * something. We log to stdout (picked up by container logs) and return 204.
 *
 * To activate, append `report-uri /api/csp-report` (or use Reporting API
 * `report-to`) to the CSP directives in `proxy.ts`. Kept opt-in for now to
 * avoid noisy logs from extension-injected scripts during early rollout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    if (body) {
      const userAgent = request.headers.get("user-agent") ?? "unknown";
      const referer = request.headers.get("referer") ?? "unknown";
      console.warn(
        "[csp-report]",
        JSON.stringify({ userAgent, referer, report: body }),
      );
    }
  } catch {
    // Swallow — endpoint must always return 204 even if body parse fails.
  }
  return new NextResponse(null, { status: 204 });
}

export function GET() {
  return NextResponse.json({ status: "csp-report endpoint" });
}
