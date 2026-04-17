import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(
  date: string | Date,
  format: "short" | "medium" | "long" | "relative" = "medium"
): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "Invalid date"

  if (format === "relative") {
    const now = Date.now()
    const diffMs = now - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)
    const diffWeek = Math.floor(diffDay / 7)
    const diffMonth = Math.floor(diffDay / 30)
    const diffYear = Math.floor(diffDay / 365)

    if (diffSec < 60) return "just now"
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`
    if (diffWeek < 5) return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`
    if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`
    return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`
  }

  if (format === "short") {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d)
  }

  if (format === "long") {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d)
  }

  // medium (default)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

export function formatNumber(
  value: number,
  options?: { compact?: boolean; currency?: string; percentage?: boolean }
): string {
  if (options?.compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (options?.currency) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: options.currency,
    }).format(value)
  }

  if (options?.percentage) {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  return new Intl.NumberFormat("en-US").format(value)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + "…"
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function groupBy<T>(
  items: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((result, item) => {
    const groupKey =
      typeof key === "function" ? key(item) : String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
