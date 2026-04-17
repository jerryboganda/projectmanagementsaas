/**
 * Generate a CSRF token for inclusion in forms.
 * Uses crypto.randomUUID — available in Edge Runtime and modern Node.js.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.length !== bufB.length) {
    // Still iterate to avoid leaking length info via timing
    let dummy = 0;
    for (let i = 0; i < bufA.length; i++) {
      dummy |= bufA[i]!;
    }
    // Use dummy to prevent optimisation
    return dummy !== dummy; // always false
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i]! ^ bufB[i]!;
  }
  return result === 0;
}

/**
 * Validate a CSRF token against the expected value.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  if (!token || !expected) return false;
  if (typeof token !== "string" || typeof expected !== "string") return false;
  return timingSafeEqual(token, expected);
}
