import { choice, ex, fill } from './types'
import type { GrammarTopic } from './types'

export const A_TOPICS: GrammarTopic[] = [
  {
    slug: 'to-be-present',
    level: 'A1',
    title: 'Verb to be: am, is, are',
    summary:
      'Learn when to use am, is and are in statements, negatives, questions and short answers. Includes examples, a printable cheat sheet and a free quiz.',
    youglish: 'she is',
    rules: [
      'Use am with I, is with he, she and it, and are with you, we and they.',
      'Negative: add not after the verb. I am not, she is not (isn’t), they are not (aren’t).',
      'Questions: put the verb before the subject. Are you ready? Is he late?',
      'Short answers repeat the verb. Yes, I am. No, she isn’t.',
      'In speech we usually contract: I’m, you’re, she’s, we’re.',
      'English uses be for age and feelings: I am 25. I am cold.',
    ],
    sections: [
      {
        heading: 'Forms',
        body: ['Be is the most common verb in English. It has three present forms, and the subject decides which one you need.'],
        table: {
          head: ['Subject', 'Affirmative', 'Negative', 'Question'],
          rows: [
            ['I', 'I am (I’m)', 'I am not (I’m not)', 'Am I late?'],
            ['he / she / it', 'She is (she’s)', 'She is not (isn’t)', 'Is she late?'],
            ['you / we / they', 'They are (they’re)', 'They are not (aren’t)', 'Are they late?'],
          ],
        },
      },
      {
        heading: 'What we use it for',
        body: ['Use be to say who or what someone is, where they are, how they feel, how old they are and where they come from.'],
        examples: [
          ex('I am a student.', 'Я студент.'),
          ex('She is from Kazakhstan.', 'Она из Казахстана.'),
          ex('We are at home.', 'Мы дома.'),
          ex('He is twenty-five years old.', 'Ему двадцать пять лет.'),
          ex('Are you tired?', 'Ты устал?'),
          ex('No, I’m not. I’m hungry!', 'Нет. Я голоден!'),
        ],
      },
      {
        heading: 'Short answers',
        body: ['Answer yes/no questions by repeating the verb. Do not contract the verb in a positive short answer.'],
        table: {
          head: ['Question', 'Yes', 'No'],
          rows: [
            ['Are you a teacher?', 'Yes, I am.', 'No, I’m not.'],
            ['Is she at home?', 'Yes, she is.', 'No, she isn’t.'],
            ['Are they ready?', 'Yes, they are.', 'No, they aren’t.'],
          ],
        },
      },
    ],
    mistakes: [
      { wrong: 'She are a doctor.', right: 'She is a doctor.', why: 'She takes is, never are.' },
      { wrong: 'I am agree.', right: 'I agree.', why: 'Agree is already a verb. Do not add am in front of it.' },
      { wrong: 'I have 25 years.', right: 'I am 25 years old.', why: 'English uses be, not have, to talk about age.' },
    ],
    quiz: [
      choice('tbp-1', 'She ___ from Spain.', ['am', 'is', 'are'], 1, 'She is a third-person singular subject, so we use is.'),
      choice('tbp-2', 'My parents ___ at work.', ['is', 'am', 'are'], 2, 'My parents means they, so we use are.'),
      fill('tbp-3', '___ you ready for the lesson?', ['Are'], 'In a question the verb comes before the subject: Are you ready?'),
      choice('tbp-4', 'I ___ a doctor. (negative)', ['am not', 'is not', 'not am'], 0, 'Add not after am: I am not a doctor.'),
      fill('tbp-5', 'He ___ tired. (negative)', ['isn’t', 'is not'], 'He is not tired, or in speech, he isn’t tired.'),
    ],
    related: ['present-simple'],
  },
  {
    slug: 'present-simple',
    level: 'A1',
    title: 'Present simple',
    summary:
      'Use the present simple for habits, routines and facts. Learn the -s rule, do/does negatives and questions, and frequency adverbs, with a free quiz.',
    youglish: 'doesn’t work',
    rules: [
      'Use the present simple for habits, routines, facts and things that are always true.',
      'With he, she and it add -s or -es to the verb: she works, he watches, it goes.',
      'Negative: do not (don’t) or does not (doesn’t) + the base verb.',
      'Question: Do or Does + subject + base verb. Does she work here?',
      'After does and doesn’t the verb has no -s: She doesn’t work.',
      'Frequency adverbs (always, usually, never) go before the main verb.',
    ],
    sections: [
      {
        heading: 'Forms',
        table: {
          head: ['Subject', 'Affirmative', 'Negative', 'Question'],
          rows: [
            ['I / you / we / they', 'They work.', 'They don’t work.', 'Do they work?'],
            ['he / she / it', 'She works.', 'She doesn’t work.', 'Does she work?'],
          ],
        },
      },
      {
        heading: 'Spelling the -s ending',
        table: {
          head: ['Rule', 'Examples'],
          rows: [
            ['Most verbs: add -s', 'work → works, play → plays'],
            ['After s, sh, ch, x, z, o: add -es', 'watch → watches, go → goes, pass → passes'],
            ['Consonant + y: change y to -ies', 'study → studies, carry → carries'],
            ['Irregular', 'have → has'],
          ],
        },
      },
      {
        heading: 'In use',
        body: ['Typical time words: every day, on Mondays, usually, often, sometimes, never.'],
        examples: [
          ex('I get up at seven every day.', 'Я встаю в семь каждый день.'),
          ex('She works in a hospital.', 'Она работает в больнице.'),
          ex('Water boils at 100 degrees.', 'Вода кипит при ста градусах.'),
          ex('They don’t watch TV in the morning.', 'Они не смотрят телевизор по утрам.'),
          ex('Does he speak English?', 'Он говорит по-английски?'),
          ex('I usually walk to work.', 'Я обычно хожу на работу пешком.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'She work in a bank.', right: 'She works in a bank.', why: 'Add -s with he, she and it.' },
      { wrong: 'Does she works here?', right: 'Does she work here?', why: 'Does already carries the -s, so the main verb stays in its base form.' },
      { wrong: 'I am go to school every day.', right: 'I go to school every day.', why: 'Do not combine be with another main verb.' },
    ],
    quiz: [
      choice('ps-1', 'My sister ___ in a hospital.', ['work', 'works', 'working'], 1, 'Add -s to the verb with she, he, it or a singular noun.'),
      choice('ps-2', 'They ___ coffee in the evening.', ['don’t drink', 'doesn’t drink', 'not drink'], 0, 'They takes don’t, followed by the base verb.'),
      fill('ps-3', '___ he speak French?', ['Does'], 'He takes does in questions: Does he speak French?'),
      fill('ps-4', 'She ___ (study) English every day. Write the correct form.', ['studies'], 'Consonant + y becomes -ies: study → studies.'),
      choice('ps-5', 'Which sentence is correct?', ['He go to work by bus.', 'He goes to work by bus.', 'He is goes to work by bus.'], 1, 'Go ends in -o, so the he/she/it form is goes.'),
    ],
    related: ['to-be-present', 'past-simple'],
  },
  {
    slug: 'past-simple',
    level: 'A2',
    title: 'Past simple',
    summary:
      'Talk about finished actions with the past simple: regular -ed verbs, common irregular verbs, did/didn’t negatives and questions, plus a free quiz.',
    youglish: 'didn’t go',
    rules: [
      'Use the past simple for finished actions and situations at a definite time in the past.',
      'Regular verbs add -ed: worked, played, stopped, studied.',
      'Irregular verbs have their own past forms: go → went, have → had, see → saw.',
      'Negative: did not (didn’t) + base verb. She didn’t go.',
      'Question: Did + subject + base verb. Did you see it?',
      'Be is the exception: was (I, he, she, it) and were (you, we, they), with no did.',
    ],
    sections: [
      {
        heading: 'Regular and irregular forms',
        table: {
          head: ['Base', 'Past', 'Pattern'],
          rows: [
            ['work', 'worked', 'add -ed'],
            ['stop', 'stopped', 'double the final consonant'],
            ['study', 'studied', 'y becomes -ied'],
            ['go', 'went', 'irregular'],
            ['buy', 'bought', 'irregular'],
            ['see', 'saw', 'irregular'],
            ['put', 'put', 'no change'],
          ],
        },
      },
      {
        heading: 'Statements, negatives and questions',
        table: {
          head: ['', 'Regular', 'Irregular'],
          rows: [
            ['Affirmative', 'I worked.', 'I went.'],
            ['Negative', 'I didn’t work.', 'I didn’t go.'],
            ['Question', 'Did you work?', 'Did you go?'],
          ],
        },
        body: ['Time words that signal the past simple: yesterday, last week, in 2019, three days ago, when I was a child.'],
      },
      {
        heading: 'In use',
        examples: [
          ex('I visited my grandmother yesterday.', 'Вчера я навестил бабушку.'),
          ex('We went to Astana last summer.', 'Прошлым летом мы ездили в Астану.'),
          ex('She didn’t call me.', 'Она мне не позвонила.'),
          ex('Did you see the match?', 'Ты смотрел матч?'),
          ex('It was cold, so I wore a coat.', 'Было холодно, поэтому я надел пальто.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'I didn’t went there.', right: 'I didn’t go there.', why: 'Didn’t already shows the past, so the main verb returns to its base form.' },
      { wrong: 'Did you saw him?', right: 'Did you see him?', why: 'After did, use the base verb, not the past form.' },
      { wrong: 'She was go to school.', right: 'She went to school.', why: 'Use the past form of go. Do not add was.' },
    ],
    quiz: [
      choice('pas-1', 'Yesterday we ___ a great film.', ['see', 'saw', 'seen'], 1, 'The past simple of see is saw.'),
      choice('pas-2', 'She ___ call me last night.', ['didn’t', 'doesn’t', 'wasn’t'], 0, 'Past negative: didn’t + base verb.'),
      fill('pas-3', 'Did you ___ (go) to the party? Write the verb.', ['go'], 'After did, use the base verb: Did you go?'),
      fill('pas-4', 'I ___ (buy) a new phone last week.', ['bought'], 'Buy is irregular: buy → bought.'),
      choice('pas-5', 'Which question is correct?', ['Did he came late?', 'Did he come late?', 'Does he came late?'], 1, 'Did + subject + base verb.'),
    ],
    related: ['present-simple', 'present-perfect'],
  },
  {
    slug: 'comparatives-superlatives',
    level: 'A2',
    title: 'Comparatives and superlatives',
    summary:
      'Compare people and things with -er/-est, more/most and irregular forms like better and best. Rules, a spelling table, common mistakes and a free quiz.',
    youglish: 'better than',
    rules: [
      'Compare two things with a comparative + than: taller than, more interesting than.',
      'One-syllable adjectives take -er / -est: tall → taller → the tallest.',
      'Longer adjectives use more / most: more expensive → the most expensive.',
      'Adjectives ending in consonant + y change y to i: easy → easier → the easiest.',
      'Irregular: good → better → the best; bad → worse → the worst.',
      'Use the before a superlative. Use as ... as for equality: as tall as.',
    ],
    sections: [
      {
        heading: 'Forms',
        table: {
          head: ['Adjective type', 'Base', 'Comparative', 'Superlative'],
          rows: [
            ['One syllable', 'tall', 'taller', 'the tallest'],
            ['Ends in -e', 'nice', 'nicer', 'the nicest'],
            ['One vowel + one consonant', 'big', 'bigger', 'the biggest'],
            ['Ends in -y', 'happy', 'happier', 'the happiest'],
            ['Two or more syllables', 'beautiful', 'more beautiful', 'the most beautiful'],
            ['Irregular', 'good', 'better', 'the best'],
            ['Irregular', 'bad', 'worse', 'the worst'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('My brother is taller than me.', 'Мой брат выше меня.'),
          ex('This book is more interesting than that one.', 'Эта книга интереснее той.'),
          ex('It is the best restaurant in town.', 'Это лучший ресторан в городе.'),
          ex('Today is hotter than yesterday.', 'Сегодня жарче, чем вчера.'),
          ex('She is as tall as her mother.', 'Она такого же роста, как её мама.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'She is more taller than me.', right: 'She is taller than me.', why: 'Use either -er or more, never both.' },
      { wrong: 'He is taller that me.', right: 'He is taller than me.', why: 'The word after a comparative is than.' },
      { wrong: 'It is the most easiest test.', right: 'It is the easiest test.', why: 'Easy is short enough for -est, so do not add most.' },
    ],
    quiz: [
      choice('cs-1', 'This phone is ___ than that one.', ['cheap', 'cheaper', 'more cheap'], 1, 'Cheap has one syllable, so add -er.'),
      choice('cs-2', 'It is the ___ day of the year.', ['hot', 'hotter', 'hottest'], 2, 'Superlative after the: double the t and add -est.'),
      choice('cs-3', 'She is ___ student in our class.', ['the most intelligent', 'more intelligent', 'most intelligent'], 0, 'Intelligent is long, so use the most.'),
      fill('cs-4', 'My English is ___ (good) than last year.', ['better'], 'Good is irregular: good → better → best.'),
      fill('cs-5', 'This exercise is ___ (easy) than the last one. Write the comparative.', ['easier'], 'Consonant + y becomes -ier: easy → easier.'),
    ],
    related: ['to-be-present', 'past-simple'],
  },
]
