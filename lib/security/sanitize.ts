const HTML_TAG_RE = /<[^>]*>/g;
const HTML_ENTITY_RE = /&(?:amp|lt|gt|quot|#39|#x27|nbsp);/gi;
const PATH_TRAVERSAL_RE = /\.\.[\\/]/g;
const MULTI_SLASH_RE = /[\\/]+/g;
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&nbsp;": " ",
};

function decodeEntities(input: string): string {
  return input.replace(HTML_ENTITY_RE, (match) => ENTITY_MAP[match.toLowerCase()] ?? match);
}

/**
 * Strips HTML tags from a string to prevent XSS.
 * For rich text, use a proper sanitizer library — this is for plain text fields.
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return decodeEntities(input.replace(HTML_TAG_RE, ""));
}

/**
 * Sanitize string for use in URLs/paths — prevent path traversal.
 */
export function sanitizePath(input: string): string {
  if (!input) return "";

  let sanitized = input;

  // Remove path traversal sequences repeatedly until none remain
  let prev = "";
  while (prev !== sanitized) {
    prev = sanitized;
    sanitized = sanitized.replace(PATH_TRAVERSAL_RE, "");
  }

  // Normalize slashes to forward slash
  sanitized = sanitized.replace(MULTI_SLASH_RE, "/");

  // Reject absolute paths (Unix or Windows drive letters)
  if (sanitized.startsWith("/") || /^[a-zA-Z]:/.test(sanitized)) {
    sanitized = sanitized.replace(/^\/+/, "").replace(/^[a-zA-Z]:[\\/]?/, "");
  }

  return sanitized;
}

/**
 * Validate and sanitize email format.
 * Returns the sanitized email or null if invalid.
 */
export function sanitizeEmail(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim().toLowerCase();

  if (trimmed.length === 0 || trimmed.length > 254) return null;

  if (!EMAIL_RE.test(trimmed)) return null;

  return trimmed;
}

/**
 * Escape string for safe HTML attribute insertion.
 */
export function escapeHtmlAttribute(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validate UUID format (v1-v5, including v4).
 */
export function isValidUuid(input: string): boolean {
  if (!input) return false;
  return UUID_V4_RE.test(input);
}

/**
 * Truncate and sanitize user input for safe display.
 */
export function sanitizeUserInput(input: string, maxLength = 10_000): string {
  if (!input) return "";
  const stripped = stripHtml(input).trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength);
}
