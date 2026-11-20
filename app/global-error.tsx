'use client'

// Last-resort boundary: it replaces the root layout, so it brings its own <html> and plain
// styles (the stylesheet may be the thing that failed to load).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: '4rem 1.5rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, color: '#1b2140', background: '#f8f9fd' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 0.75rem' }}>The app failed to start</h1>
        <p style={{ maxWidth: '34rem', margin: '0 0 1.5rem' }}>Reload the page. If the problem continues, try again in a few minutes.</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: '0.7rem 1.2rem', border: 0, borderRadius: 8, background: '#2f4bd8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
        >
          Reload
        </button>
      </body>
    </html>
  )
}
