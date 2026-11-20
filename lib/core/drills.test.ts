import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERBS, SUBJECTS, TENSES, TENSE_ORDER, checkDrill, conjugate, isTense, makeDrill } from './drills.ts'
import type { Frame, Polarity, Tense } from './drills.ts'

const verb = (base: string) => VERBS.find((e) => e.forms.base === base)!.forms
const subject = (text: string) => SUBJECTS.find((s) => s.text === text)!
const frame = (s: string, v: string, tail: string): Frame => ({ subject: subject(s), verb: verb(v), tail })

const say = (f: Frame, tense: Tense) =>
  (['affirmative', 'negative', 'question'] as Polarity[]).map((p) => conjugate(f, tense, p))

test('regular verb across all seven tenses', () => {
  const f = frame('she', 'work', 'at a bank')
  assert.deepEqual(say(f, 'present-simple'), ['She works at a bank.', 'She does not work at a bank.', 'Does she work at a bank?'])
  assert.deepEqual(say(f, 'past-simple'), ['She worked at a bank.', 'She did not work at a bank.', 'Did she work at a bank?'])
  assert.deepEqual(say(f, 'future-simple'), ['She will work at a bank.', 'She will not work at a bank.', 'Will she work at a bank?'])
  assert.deepEqual(say(f, 'present-continuous'), ['She is working at a bank.', 'She is not working at a bank.', 'Is she working at a bank?'])
  assert.deepEqual(say(f, 'past-continuous'), ['She was working at a bank.', 'She was not working at a bank.', 'Was she working at a bank?'])
  assert.deepEqual(say(f, 'present-perfect'), ['She has worked at a bank.', 'She has not worked at a bank.', 'Has she worked at a bank?'])
  assert.deepEqual(say(f, 'past-perfect'), ['She had worked at a bank.', 'She had not worked at a bank.', 'Had she worked at a bank?'])
})

test('person agreement and irregular verbs', () => {
  const go = frame('I', 'go', 'to school')
  assert.deepEqual(say(go, 'present-simple'), ['I go to school.', 'I do not go to school.', 'Do I go to school?'])
  assert.equal(conjugate(go, 'past-simple', 'affirmative'), 'I went to school.')
  assert.equal(conjugate(go, 'present-perfect', 'question'), 'Have I gone to school?')
  assert.equal(conjugate(go, 'present-continuous', 'affirmative'), 'I am going to school.')
  assert.equal(conjugate(go, 'past-continuous', 'negative'), 'I was not going to school.')
  assert.equal(conjugate(frame('they', 'go', 'home'), 'present-continuous', 'question'), 'Are they going home?')
  assert.equal(conjugate(frame('we', 'go', 'home'), 'past-continuous', 'affirmative'), 'We were going home.')
  assert.equal(conjugate(frame('my brother', 'study', 'English'), 'present-simple', 'affirmative'), 'My brother studies English.')
  assert.equal(conjugate(frame('Anna', 'watch', 'a film'), 'present-simple', 'question'), 'Does Anna watch a film?')
  assert.equal(conjugate(frame('the children', 'eat', 'rice'), 'past-simple', 'negative'), 'The children did not eat rice.')
  assert.equal(conjugate(frame('he', 'have', 'lunch'), 'present-perfect', 'affirmative'), 'He has had lunch.')
})

test('"be" uses its own pattern in the simple tenses', () => {
  const they = frame('they', 'be', 'at home')
  assert.deepEqual(say(they, 'present-simple'), ['They are at home.', 'They are not at home.', 'Are they at home?'])
  assert.deepEqual(say(they, 'past-simple'), ['They were at home.', 'They were not at home.', 'Were they at home?'])
  assert.equal(conjugate(they, 'future-simple', 'affirmative'), 'They will be at home.')
  assert.equal(conjugate(they, 'present-perfect', 'affirmative'), 'They have been at home.')
  assert.equal(conjugate(they, 'past-perfect', 'question'), 'Had they been at home?')
  const i = frame('I', 'be', 'happy')
  assert.deepEqual(say(i, 'present-simple'), ['I am happy.', 'I am not happy.', 'Am I happy?'])
  assert.equal(conjugate(i, 'past-simple', 'affirmative'), 'I was happy.')
  assert.throws(() => conjugate(i, 'present-continuous', 'affirmative'))
})

test('makeDrill is deterministic and balanced', () => {
  const a = makeDrill({ tenses: ['past-simple', 'present-perfect'], count: 30, seed: 7 })
  const b = makeDrill({ tenses: ['past-simple', 'present-perfect'], count: 30, seed: 7 })
  assert.deepEqual(a, b)
  assert.notDeepEqual(a, makeDrill({ tenses: ['past-simple', 'present-perfect'], count: 30, seed: 8 }))
  for (const polarity of ['affirmative', 'negative', 'question']) {
    assert.equal(a.filter((x) => x.polarity === polarity).length, 10)
  }
  assert.equal(new Set(a.map((x) => x.id)).size, 30)
  assert.deepEqual(makeDrill({ tenses: [], count: 5, seed: 1 }), [])
  assert.deepEqual(makeDrill({ tenses: ['past-simple'], count: 0, seed: 1 }), [])
})

test('every generated sentence is well formed, over many seeds and tenses', () => {
  for (let seed = 1; seed <= 200; seed++) {
    for (const item of makeDrill({ tenses: TENSE_ORDER, count: 12, seed })) {
      assert.match(item.expected, /^[A-Z][^]*[.?]$/, item.expected)
      assert.doesNotMatch(item.expected, /undefined|\s{2}|\s[.?]$/, item.expected)
      assert.equal(item.expected.endsWith('?'), item.polarity === 'question')
      if (item.tense === 'present-continuous' || item.tense === 'past-continuous') {
        assert.doesNotMatch(item.cue, /\/ (be|like|know|want) \//, `stative or be in continuous: ${item.cue}`)
      }
      assert.ok(item.cue.split(' / ').length === 3)
    }
  }
})

test('checkDrill: exact forms, contractions accepted, typos rejected', () => {
  const item = (expected: string) => ({ expected })
  assert.equal(checkDrill(item('She does not work at a bank.'), "she doesn't work at a bank").correct, true)
  assert.equal(checkDrill(item('She is working at a bank.'), "She's working at a bank.").correct, true)
  assert.equal(checkDrill(item('She is not working at a bank.'), "She isn't working at a bank").correct, true)
  assert.equal(checkDrill(item('She is not working at a bank.'), "She's not working at a bank").correct, true)
  assert.equal(checkDrill(item('She has worked at a bank.'), "She’s worked at a bank").correct, true)
  assert.equal(checkDrill(item('They had worked at a bank.'), "They'd worked at a bank").correct, true)
  assert.equal(checkDrill(item('I will not go home.'), "I won't go home").correct, true)
  assert.equal(checkDrill(item('We are not here.'), "We aren't here").correct, true)
  assert.equal(checkDrill(item('Anna is working.'), "Anna's working").correct, true)

  assert.equal(checkDrill(item('She works at a bank.'), 'She work at a bank.').correct, false)
  assert.equal(checkDrill(item('She works at a bank.'), 'She workz at a bank.').correct, false)
  assert.equal(checkDrill(item('She worked at a bank.'), 'She works at a bank.').correct, false)
  assert.equal(checkDrill(item('Does she work at a bank?'), 'She works at a bank?').correct, false)
  assert.equal(checkDrill(item('She is working.'), '').correct, false)
})

test('tense metadata is complete', () => {
  assert.equal(TENSE_ORDER.length, Object.keys(TENSES).length)
  for (const key of TENSE_ORDER) {
    const info = TENSES[key]
    assert.equal(info.slug, key)
    assert.ok(info.use && info.example && info.signals.length > 0)
    assert.deepEqual(Object.keys(info.formulas).sort(), ['affirmative', 'negative', 'question'])
    assert.ok(isTense(key))
  }
  assert.equal(isTense('toString'), false)
  assert.equal(isTense('future-perfect'), false)
})
