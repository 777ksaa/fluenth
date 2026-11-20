import { ImageResponse } from 'next/og'
import { SITE } from '@/lib/seo/site'

// Default social-share card for every page that does not set its own.
export const alt = `${SITE.name}: ${SITE.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#0f1426',
          color: '#e7eaf6',
        }}
      >
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, color: '#8fa3ff' }}>{SITE.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', fontSize: 112, fontWeight: 700, lineHeight: 1.05 }}>Look up a word.</div>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '0 20px',
              fontSize: 112,
              fontWeight: 700,
              lineHeight: 1.15,
              background: '#ffe066',
              color: '#1b2140',
            }}
          >
            Hear it used.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#a3abc9' }}>{SITE.tagline}</div>
      </div>
    ),
    { ...size },
  )
}
