// Guards the ?next= parameter used after sign-in so it cannot become an open redirect.

/** Returns `next` only if it is a same-site absolute path; otherwise the fallback. */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > 300) return fallback
  if (!next.startsWith('/')) return fallback
  // "//host" and "/\host" are interpreted by browsers as another origin.
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback
  return next
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}
