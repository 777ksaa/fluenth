// Words and idioms listed in the sitemap and on /vocabulary from day one, so crawlers and
// visitors have something to find before anyone has searched. Each page is generated on first
// request, cached in Postgres and then served from the ISR cache. The thin-content guard in
// lib/core/dictionary.ts still decides whether a given entry is indexable.

export const SEED_GROUPS = {
  words: [
    'achieve', 'afford', 'ambition', 'argue', 'attitude', 'benefit', 'challenge', 'comfortable',
    'confident', 'consider', 'convenient', 'curious', 'deadline', 'delighted', 'determine', 'efficient',
    'encourage', 'enormous', 'essential', 'exaggerate', 'familiar', 'flexible', 'generous', 'genuine',
    'grateful', 'hesitate', 'improve', 'influence', 'inspire', 'knowledge', 'lazy', 'manage',
    'negotiate', 'nervous', 'obvious', 'opportunity', 'patient', 'persuade', 'prefer', 'reliable',
    'responsible', 'schedule', 'significant', 'struggle', 'suggest', 'tolerate', 'unexpected', 'valuable',
    'whisper', 'worthwhile',
  ],
  idioms: [
    'break the ice', 'piece of cake', 'once in a blue moon', 'hit the nail on the head',
    'under the weather', 'spill the beans', 'a blessing in disguise', 'cost an arm and a leg',
    'let the cat out of the bag', 'on the ball', 'the last straw', 'bite the bullet',
    'burn the midnight oil', 'call it a day', 'cut corners', 'get out of hand',
  ],
  phrasalVerbs: [
    'give up', 'look forward to', 'put off', 'run out of', 'carry on', 'come across',
    'figure out', 'turn down', 'take after', 'work out',
  ],
} as const

export const SEED_WORDS: string[] = [...SEED_GROUPS.words, ...SEED_GROUPS.idioms, ...SEED_GROUPS.phrasalVerbs]
