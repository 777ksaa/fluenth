import { test } from 'node:test'
import assert from 'node:assert/strict'
import { embedUrl, isYoutubeId, parseClip, youglishUrl } from './media.ts'

const row = {
  id: 'c1',
  video_id: 'dQw4w9WgXcQ',
  start_seconds: 12,
  end_seconds: 18,
  transcript: 'Break the ice.',
  attribution: 'Example Channel',
  license: 'embed (YouTube ToS)',
}

test('a complete row becomes a clip', () => {
  assert.deepEqual(parseClip(row), {
    id: 'c1',
    videoId: 'dQw4w9WgXcQ',
    start: 12,
    end: 18,
    transcript: 'Break the ice.',
    attribution: 'Example Channel',
    license: 'embed (YouTube ToS)',
  })
  assert.equal(parseClip({ ...row, end_seconds: null })?.end, null)
})

test('unsafe or incomplete rows are dropped', () => {
  assert.equal(parseClip({ ...row, video_id: '"><script>alert(1)</script>' }), null)
  assert.equal(parseClip({ ...row, video_id: 'short' }), null)
  assert.equal(parseClip({ ...row, start_seconds: -1 }), null)
  assert.equal(parseClip({ ...row, end_seconds: 12 }), null)
  assert.equal(parseClip({ ...row, transcript: '   ' }), null)
  assert.equal(parseClip({ ...row, license: undefined }), null)
  assert.equal(parseClip(null), null)
  assert.equal(parseClip('x'), null)
  assert.equal(isYoutubeId('dQw4w9WgXcQ'), true)
})

test('embed and fallback URLs', () => {
  const url = new URL(embedUrl({ videoId: 'dQw4w9WgXcQ', start: 12, end: 18 }))
  assert.equal(url.origin, 'https://www.youtube-nocookie.com')
  assert.equal(url.pathname, '/embed/dQw4w9WgXcQ')
  assert.equal(url.searchParams.get('start'), '12')
  assert.equal(url.searchParams.get('end'), '18')
  assert.equal(new URL(embedUrl({ videoId: 'dQw4w9WgXcQ', start: 0, end: null })).searchParams.has('end'), false)
  assert.equal(youglishUrl('break the ice'), 'https://youglish.com/pronounce/break%20the%20ice/english')
})
