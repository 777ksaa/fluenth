import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/seo/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8f9fd',
    theme_color: '#2f4bd8',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
