// Schema.org JSON-LD builders. Pure functions so they are easy to test.
// Only mark up what the page visibly shows, and only types Google documents or schema.org defines.

import { absoluteUrl, SITE } from './site'

export type JsonLd = Record<string, unknown>

/**
 * Serialises for inline <script type="application/ld+json">. Dictionary text comes from a
 * third-party API, so "<" is escaped to stop a "</script>" in a definition from breaking out.
 */
// Built at runtime: these two characters are line terminators in JavaScript source, so they
// cannot be written inside a regex literal.
const LINE_SEPARATOR = String.fromCharCode(0x2028)
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029)

export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .split(LINE_SEPARATOR)
    .join('\\u2028')
    .split(PARAGRAPH_SEPARATOR)
    .join('\\u2029')
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: absoluteUrl('/'),
    description: SITE.description,
    inLanguage: 'en',
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function definedTermJsonLd(input: { word: string; description: string; path: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: input.word,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: 'en',
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: `${SITE.name} English dictionary`,
      url: absoluteUrl('/vocabulary'),
    },
  }
}

export function learningResourceJsonLd(input: {
  name: string
  description: string
  path: string
  level: string
  teaches: string
  type: 'Lesson' | 'Dialogue' | 'Exercise'
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: 'en',
    isAccessibleForFree: true,
    educationalLevel: `CEFR ${input.level}`,
    learningResourceType: input.type,
    teaches: input.teaches,
    provider: { '@type': 'Organization', name: SITE.name, url: absoluteUrl('/') },
  }
}
