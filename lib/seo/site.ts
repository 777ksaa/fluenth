// Site-wide identity. Rename the product here and everything (metadata, JSON-LD, sitemap) follows.

export const SITE = {
  name: 'FluentPath',
  tagline: 'Learn English from A1 to C2',
  description:
    'Look up any English word with real video examples, learn grammar from A1 to C2, practise dictation and speaking, and review vocabulary with spaced repetition.',
  locale: 'en',
} as const

/** Canonical origin without a trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/** Public contact address for the About and Privacy pages. Optional: nothing is shown when it is not set. */
export function contactEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? value : null
}
