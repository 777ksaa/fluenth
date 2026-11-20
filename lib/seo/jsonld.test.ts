import { test } from 'node:test'
import assert from 'node:assert/strict'
import { breadcrumbJsonLd, definedTermJsonLd, learningResourceJsonLd, serializeJsonLd } from './jsonld.ts'

const LS = String.fromCharCode(0x2028)

test('serialised JSON-LD cannot close the script tag', () => {
  const hostile = definedTermJsonLd({
    word: 'x',
    description: `</script><script>alert(1)</script>${LS}`,
    path: '/vocabulary/x',
  })
  const out = serializeJsonLd(hostile)
  assert.equal(out.includes('<'), false)
  assert.equal(out.includes(LS), false)
  assert.equal(JSON.parse(out).description, `</script><script>alert(1)</script>${LS}`)
})

test('breadcrumbs are positioned and absolute', () => {
  const b = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Grammar', path: '/grammar' },
  ]) as { itemListElement: { position: number; item: string }[] }
  assert.deepEqual(b.itemListElement.map((i) => i.position), [1, 2])
  assert.match(b.itemListElement[1].item, /^https?:\/\/.+\/grammar$/)
})

test('learning resource carries level and free access', () => {
  const r = learningResourceJsonLd({ name: 'Present perfect', description: 'd', path: '/grammar/present-perfect', level: 'B1', teaches: 'Present perfect', type: 'Lesson' })
  assert.equal(r['@type'], 'LearningResource')
  assert.equal(r.isAccessibleForFree, true)
  assert.equal(r.educationalLevel, 'CEFR B1')
})
