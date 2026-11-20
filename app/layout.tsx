import type { Metadata, Viewport } from 'next'
import { Gentium_Plus, Onest } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'
import { BottomNav } from '@/components/bottom-nav'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { JsonLd } from '@/components/json-ld'
import { ProfileProvider } from '@/components/profile-context'
import { websiteJsonLd } from '@/lib/seo/jsonld'
import { SITE, siteUrl } from '@/lib/seo/site'

// Gentium was designed for linguists: full IPA and Cyrillic coverage, which suits dictionary
// entries and Russian translations. Onest is a clean sans with Cyrillic for the interface.
// Swap either here and update --font-serif / --font-sans in globals.css if you rebrand.
const serif = Gentium_Plus({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-gentium',
  display: 'swap',
})
const sans = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-onest', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_US' },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fd' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1426' },
  ],
}

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link sr-only-focusable">
          Skip to content
        </a>
        <ProfileProvider>
          <Header />
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </ProfileProvider>
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  )
}
