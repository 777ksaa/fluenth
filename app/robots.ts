import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private, per-user or non-content URLs. Nothing here should ever rank.
        disallow: ['/api/', '/auth/', '/login', '/dashboard', '/review', '/deck', '/settings', '/tutor'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
