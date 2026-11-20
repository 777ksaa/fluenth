import type { Metadata } from 'next'
import { SITE } from './site'

interface PageMetaInput {
  /** Page title without the site name; the root layout's title template appends it. */
  title: string
  description: string
  /** Canonical path, e.g. "/grammar/present-perfect". */
  path: string
  /** Keep the page out of search results (thin or private content). Links are still followed. */
  noindex?: boolean
  type?: 'website' | 'article'
}

/**
 * One place that produces title, description, canonical URL, Open Graph and Twitter tags,
 * so every page is consistent and none forgets its canonical.
 */
export function pageMetadata({ title, description, path, noindex = false, type = 'website' }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url: path,
      siteName: SITE.name,
      locale: 'en_US',
      type,
    },
    twitter: { card: 'summary_large_image', title: `${title} | ${SITE.name}`, description },
  }
}
