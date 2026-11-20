import { serializeJsonLd } from '@/lib/seo/jsonld'
import type { JsonLd as JsonLdData } from '@/lib/seo/jsonld'

/** Renders structured data. The serialiser escapes "<", so third-party text cannot break out of the tag. */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
