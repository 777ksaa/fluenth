import { choice, ex, fill } from './types'
import type { GrammarTopic } from './types'

export const B_TOPICS: GrammarTopic[] = [
  {
    slug: 'present-perfect',
    level: 'B1',
    title: 'Present perfect',
    summary:
      'Use the present perfect for experiences, recent news and unfinished time. Learn have/has + past participle, for vs since, ever, never, yet and already.',
    youglish: 'I’ve never',
    rules: [
      'Form: have/has + past participle. She has finished.',
      'Use it for experiences (I have been to Rome), results now (I have lost my keys) and situations that continue up to now (I have lived here for ten years).',
      'for + a period (for two years). since + a starting point (since 2020).',
      'Common signals: ever, never, just, already, yet, so far, recently.',
      'Do not use it with a finished time (yesterday, in 2019, last week). Use the past simple.',
      'Negative: haven’t/hasn’t + past participle. Question: Have/Has + subject + past participle?',
    ],
    sections: [
      {
        heading: 'Forms',
        table: {
          head: ['', 'I / you / we / they', 'he / she / it'],
          rows: [
            ['Affirmative', 'have worked', 'has worked'],
            ['Negative', 'haven’t worked', 'hasn’t worked'],
            ['Question', 'Have you worked?', 'Has she worked?'],
          ],
        },
      },
      {
        heading: 'For and since',
        table: {
          head: ['Word', 'Use it with', 'Examples'],
          rows: [
            ['for', 'a length of time', 'for three years, for two hours'],
            ['since', 'a starting point', 'since 2021, since Monday, since I was a child'],
          ],
        },
      },
      {
        heading: 'Present perfect or past simple?',
        body: ['If the time is finished and named, use the past simple. If the time is not named, or still continuing, use the present perfect.'],
        table: {
          head: ['Present perfect', 'Past simple'],
          rows: [
            ['I have lost my keys. (I still cannot find them.)', 'I lost my keys yesterday.'],
            ['Have you ever been to Japan?', 'Did you go to Japan last year?'],
            ['She has lived here since 2019.', 'She lived here in 2019.'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('I have never eaten sushi.', 'Я никогда не ел суши.'),
          ex('She has just left.', 'Она только что ушла.'),
          ex('We have lived here for ten years.', 'Мы живём здесь десять лет.'),
          ex('Have you finished your homework yet?', 'Ты уже сделал домашнее задание?'),
          ex('He hasn’t called me since Monday.', 'Он не звонил мне с понедельника.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'I have seen him yesterday.', right: 'I saw him yesterday.', why: 'Yesterday is a finished time, so use the past simple.' },
      { wrong: 'I am living here since 2019.', right: 'I have lived here since 2019.', why: 'A situation that continues up to now with since or for needs the present perfect.' },
      { wrong: 'She has went home.', right: 'She has gone home.', why: 'Use the past participle (gone), not the past simple form (went).' },
    ],
    quiz: [
      choice('pp-1', 'I have never ___ sushi.', ['eat', 'ate', 'eaten'], 2, 'Present perfect needs the past participle: eaten.'),
      choice('pp-2', 'We have lived here ___ 2018.', ['for', 'since', 'from'], 1, 'Since goes with a starting point such as 2018.'),
      choice('pp-3', 'She ___ finished her homework yet.', ['hasn’t', 'haven’t', 'isn’t'], 0, 'She takes has, so the negative is hasn’t.'),
      fill('pp-4', 'Have you ever ___ (be) to London? Write the correct form.', ['been'], 'The past participle of be is been.'),
      choice('pp-5', 'Which sentence is correct?', ['I have seen him yesterday.', 'I saw him yesterday.', 'I have saw him yesterday.'], 1, 'Yesterday names a finished time, so use the past simple.'),
    ],
    related: ['past-simple', 'first-second-conditional'],
  },
  {
    slug: 'first-second-conditional',
    level: 'B1',
    title: 'First and second conditionals',
    summary:
      'Talk about real and imaginary situations with if: first conditional (if + present, will) and second conditional (if + past, would). Examples and a free quiz.',
    youglish: 'if I were you',
    rules: [
      'First conditional: if + present simple, will + base verb. A real, likely future situation.',
      'Second conditional: if + past simple, would + base verb. An unreal or unlikely situation now.',
      'Never put will or would in the if-clause. If it rains, not If it will rain.',
      'The if-clause can come first (use a comma) or second (no comma).',
      'In formal English use were for every person: If I were you.',
      'Zero conditional (if + present, present) is for general truths: If you heat ice, it melts.',
    ],
    sections: [
      {
        heading: 'Forms',
        table: {
          head: ['Type', 'If-clause', 'Main clause', 'Example'],
          rows: [
            ['Zero', 'if + present simple', 'present simple', 'If you heat ice, it melts.'],
            ['First', 'if + present simple', 'will + base verb', 'If it rains, we will stay at home.'],
            ['Second', 'if + past simple', 'would + base verb', 'If I had a car, I would drive to work.'],
          ],
        },
      },
      {
        heading: 'Which one do I need?',
        body: [
          'Ask yourself whether the situation is a real possibility. If it is, use the first conditional. If it is imaginary, unlikely or impossible right now, use the second.',
          'Past simple in a second-conditional if-clause does not talk about the past. It signals that the situation is not real.',
        ],
        examples: [
          ex('If you study hard, you will pass the exam.', 'Если будешь усердно учиться, ты сдашь экзамен.'),
          ex('If it rains tomorrow, we won’t go to the park.', 'Если завтра будет дождь, мы не пойдём в парк.'),
          ex('If I won the lottery, I would travel the world.', 'Если бы я выиграл в лотерею, я бы объехал весь мир.'),
          ex('If I were you, I would call her.', 'На твоём месте я бы ей позвонил.'),
          ex('What would you do if you lost your passport?', 'Что бы ты сделал, если бы потерял паспорт?'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'If it will rain, we will stay home.', right: 'If it rains, we will stay home.', why: 'Do not use will in the if-clause.' },
      { wrong: 'If I would have time, I would help you.', right: 'If I had time, I would help you.', why: 'The second conditional uses the past simple in the if-clause.' },
      { wrong: 'If I was you, I would go.', right: 'If I were you, I would go.', why: 'Standard English uses were after if for every person. Was is common in casual speech.' },
    ],
    quiz: [
      choice('fsc-1', 'If it ___ tomorrow, we will stay at home.', ['will rain', 'rains', 'would rain'], 1, 'First conditional: present simple in the if-clause.'),
      choice('fsc-2', 'If I had more time, I ___ learn Chinese.', ['will', 'would', 'am going to'], 1, 'Second conditional: would + base verb.'),
      fill('fsc-3', 'If you ___ (not / hurry), you will miss the bus. Write the verb phrase.', ['don’t hurry', 'do not hurry'], 'First conditional negative: do not + base verb.'),
      choice('fsc-4', 'Which sentence is a second conditional?', ['If I see him, I will tell him.', 'If I saw him, I would tell him.', 'If I had seen him, I would have told him.'], 1, 'Past simple + would is the second conditional.'),
      fill('fsc-5', 'If she ___ (study) harder, she would pass the exam.', ['studied'], 'Second conditional: past simple in the if-clause.'),
    ],
    related: ['present-perfect', 'mixed-conditionals'],
  },
  {
    slug: 'passive-voice',
    level: 'B2',
    title: 'Passive voice',
    summary:
      'Learn how to form and use the passive voice in every tense (be + past participle), when to add by + agent, and the most common passive mistakes.',
    youglish: 'was built',
    rules: [
      'Form: be + past participle. The house was built in 1990.',
      'Use the passive when the action matters more than who did it, when the doer is unknown or obvious, or in formal and scientific writing.',
      'Change the tense by changing be: is made, was made, has been made, will be made, can be made.',
      'Add by + agent only when the doer is important or surprising.',
      'Only transitive verbs (verbs with an object) can be passive. Happen, arrive and sleep cannot.',
      'Questions invert be and the subject: Was the window broken by the storm?',
    ],
    sections: [
      {
        heading: 'Passive in different tenses',
        table: {
          head: ['Tense', 'Active', 'Passive'],
          rows: [
            ['Present simple', 'They make cars here.', 'Cars are made here.'],
            ['Past simple', 'Someone stole my bike.', 'My bike was stolen.'],
            ['Present continuous', 'They are repairing the road.', 'The road is being repaired.'],
            ['Present perfect', 'They have cancelled the flight.', 'The flight has been cancelled.'],
            ['Future', 'They will announce the winner.', 'The winner will be announced.'],
            ['Modal', 'You must sign the form.', 'The form must be signed.'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('The bridge was built in 1998.', 'Мост построили в 1998 году.'),
          ex('English is spoken all over the world.', 'На английском говорят по всему миру.'),
          ex('My phone has been stolen!', 'Мой телефон украли!'),
          ex('The report will be finished by Friday.', 'Отчёт будет готов к пятнице.'),
          ex('The road is being repaired.', 'Дорогу сейчас ремонтируют.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'The accident was happened yesterday.', right: 'The accident happened yesterday.', why: 'Happen has no object, so it cannot be passive.' },
      { wrong: 'The letter was wrote by Anna.', right: 'The letter was written by Anna.', why: 'Use the past participle (written), not the past simple (wrote).' },
      { wrong: 'English speaks in many countries.', right: 'English is spoken in many countries.', why: 'English receives the action, so the verb must be passive.' },
    ],
    quiz: [
      choice('pv-1', 'The bridge ___ in 1998.', ['built', 'was built', 'has built'], 1, 'Past passive: was + past participle.'),
      choice('pv-2', 'My phone ___ yesterday.', ['was stolen', 'stole', 'is stolen'], 0, 'A finished time (yesterday) needs the past passive: was stolen.'),
      fill('pv-3', 'The report will ___ by Friday. (finish)', ['be finished'], 'Future passive: will be + past participle.'),
      choice('pv-4', 'Which sentence cannot be made passive?', ['They built a house.', 'The accident happened.', 'She wrote a letter.'], 1, 'Happen is intransitive: it has no object to become the subject.'),
      fill('pv-5', 'The road ___ (repair) at the moment. Use the present continuous passive.', ['is being repaired'], 'Present continuous passive: is/are being + past participle.'),
    ],
    related: ['present-perfect', 'reported-speech'],
  },
  {
    slug: 'reported-speech',
    level: 'B2',
    title: 'Reported speech',
    summary:
      'Report what people said: backshift of tenses, changes to pronouns and time words, reporting questions and commands, with examples and a free quiz.',
    youglish: 'he told me that',
    rules: [
      'After a past reporting verb (said, told), shift the tense back: is → was, will → would, present simple → past simple.',
      'Change pronouns and time or place words to fit the new situation: now → then, tomorrow → the next day, here → there.',
      'Use tell + person (She told me that ...) and say without one (She said that ...).',
      'Reported questions use statement word order with no do/did: He asked where I lived.',
      'Yes/no questions use if or whether: She asked if I was ready.',
      'Commands: tell or ask + person + to + verb. He told me to wait.',
      'No backshift is needed if the reporting verb is in the present (She says she’s tired) or the fact is still true.',
    ],
    sections: [
      {
        heading: 'Backshift',
        table: {
          head: ['Direct speech', 'Reported speech'],
          rows: [
            ['“I like it.”', 'She said she liked it.'],
            ['“I am waiting.”', 'He said he was waiting.'],
            ['“I have finished.”', 'She said she had finished.'],
            ['“I saw him.”', 'He said he had seen him.'],
            ['“I will call.”', 'She said she would call.'],
            ['“I can swim.”', 'He said he could swim.'],
          ],
        },
      },
      {
        heading: 'Time and place words',
        table: {
          head: ['Direct', 'Reported'],
          rows: [
            ['now', 'then'],
            ['today', 'that day'],
            ['yesterday', 'the day before'],
            ['tomorrow', 'the next day'],
            ['here', 'there'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('She said she was tired.', 'Она сказала, что устала.'),
          ex('He told me he would call later.', 'Он сказал мне, что позвонит позже.'),
          ex('They asked where I lived.', 'Они спросили, где я живу.'),
          ex('She asked if I was ready.', 'Она спросила, готов ли я.'),
          ex('The doctor told me to rest.', 'Врач велел мне отдохнуть.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'She asked me where did I live.', right: 'She asked me where I lived.', why: 'Reported questions use statement word order, with no did.' },
      { wrong: 'He said me that he was busy.', right: 'He told me that he was busy.', why: 'Say does not take a person directly. Use tell + person, or say that.' },
      { wrong: 'She told that she was tired.', right: 'She said that she was tired.', why: 'Tell needs a person: She told me that she was tired.' },
    ],
    quiz: [
      choice('rs-1', '“I am hungry,” he said. He said he ___ hungry.', ['is', 'was', 'were'], 1, 'Backshift: am → was.'),
      choice('rs-2', '“I will help you,” she said. She said she ___ help me.', ['will', 'would', 'can'], 1, 'Backshift: will → would.'),
      choice('rs-3', 'He ___ me that the train was late.', ['said', 'told', 'spoke'], 1, 'Tell needs a person after it: told me.'),
      fill('rs-4', 'She asked me where I ___ (live). Write the correct form.', ['lived'], 'Reported question: statement order and backshift, so lived.'),
      choice('rs-5', '“Close the window,” he said. He told me ___.', ['close the window', 'to close the window', 'that I close the window'], 1, 'Reported commands: tell + person + to + verb.'),
    ],
    related: ['passive-voice', 'first-second-conditional'],
  },
]
