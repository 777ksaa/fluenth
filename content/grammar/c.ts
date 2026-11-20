import { choice, ex, fill } from './types'
import type { GrammarTopic } from './types'

export const C_TOPICS: GrammarTopic[] = [
  {
    slug: 'inversion',
    level: 'C1',
    title: 'Inversion after negative adverbials',
    summary:
      'Master inversion for emphasis: Never have I, Rarely do we, Not only did, No sooner had, Little did he know, and conditional inversion like Had I known.',
    youglish: 'never have I',
    rules: [
      'When a negative or restrictive adverbial starts the sentence, the auxiliary goes before the subject: Never have I seen such a view.',
      'If there is no auxiliary, add do, does or did: Rarely does he complain.',
      'Common triggers: never, rarely, seldom, hardly, scarcely, little, not only, no sooner, nowhere, under no circumstances, only after, only when.',
      'No sooner ... than and Hardly ... when take the past perfect, inverted: No sooner had we left than it rained.',
      'Conditional inversion drops if: Had I known (If I had known), Were she here (If she were here), Should you need help (If you need help).',
      'Inversion is formal and emphatic. Use it sparingly.',
    ],
    sections: [
      {
        heading: 'Patterns',
        table: {
          head: ['Starter', 'Pattern', 'Example'],
          rows: [
            ['Never, rarely, seldom', 'adverb + auxiliary + subject + verb', 'Rarely do we see such talent.'],
            ['Not only ... but also', 'Not only + auxiliary + subject', 'Not only did she win, but she also broke the record.'],
            ['No sooner ... than', 'No sooner + had + subject + past participle', 'No sooner had we sat down than the phone rang.'],
            ['Hardly ... when', 'Hardly + had + subject + past participle', 'Hardly had I arrived when it started to rain.'],
            ['Little', 'Little + auxiliary + subject + verb', 'Little did he know the truth.'],
            ['Only after, only when', 'Only after + clause + auxiliary + subject', 'Only after the results came out did we understand.'],
            ['Under no circumstances', 'adverbial + auxiliary + subject', 'Under no circumstances should you open this door.'],
            ['Had, Were, Should', 'verb + subject (no if)', 'Had I known, I would have called.'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('Never have I seen such a beautiful view.', 'Никогда прежде я не видел такого красивого вида.'),
          ex('Rarely does he complain about work.', 'Он редко жалуется на работу.'),
          ex('Little did she suspect the truth.', 'Она и не подозревала правды.'),
          ex('Under no circumstances should you open this door.', 'Ни при каких обстоятельствах не открывайте эту дверь.'),
          ex('Had I known, I would have called you.', 'Знай я об этом, я бы тебе позвонил.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'Never I have seen such a view.', right: 'Never have I seen such a view.', why: 'After a negative opener the auxiliary comes first.' },
      { wrong: 'Rarely he complains.', right: 'Rarely does he complain.', why: 'With no auxiliary, add do/does/did and use the base verb.' },
      { wrong: 'Not only she won, but she also broke the record.', right: 'Not only did she win, but she also broke the record.', why: 'Not only at the start of a sentence triggers inversion.' },
    ],
    quiz: [
      choice('inv-1', '___ such a beautiful view.', ['Never I have seen', 'Never have I seen', 'Never I saw'], 1, 'Never + auxiliary + subject + past participle.'),
      choice('inv-2', 'Rarely ___ late for work.', ['he is', 'is he', 'does he be'], 1, 'Be is its own auxiliary, so it moves before the subject.'),
      fill('inv-3', 'No sooner ___ we sat down than the phone rang.', ['had'], 'No sooner takes the past perfect: No sooner had we sat down than ...'),
      choice('inv-4', 'Which means the same as “If I had known”?', ['Had I known', 'Did I know', 'Would I know'], 0, 'Conditional inversion: Had + subject + past participle.'),
      fill('inv-5', 'Not only ___ she win the race, but she also broke the record.', ['did'], 'Not only + did + subject + base verb.'),
    ],
    related: ['mixed-conditionals', 'cleft-sentences'],
  },
  {
    slug: 'mixed-conditionals',
    level: 'C1',
    title: 'Mixed conditionals',
    summary:
      'Combine past and present time in one conditional sentence: past cause with present result, and present state with past result. Rules, examples and a quiz.',
    youglish: 'if I had known',
    rules: [
      'A mixed conditional links two different times: one in the if-clause and another in the main clause.',
      'Past cause, present result: if + past perfect, would + base verb. If I had taken the job, I would be rich now.',
      'Present state, past result: if + past simple, would have + past participle. If I were braver, I would have spoken up.',
      'Use them only when the two times really differ. Otherwise use the second or third conditional.',
      'Formal inversion is possible: Had I taken the job, I would be rich now.',
      'Could and might can replace would: If I had studied, I might be a doctor now.',
    ],
    sections: [
      {
        heading: 'Forms',
        table: {
          head: ['Type', 'If-clause', 'Main clause', 'Example'],
          rows: [
            ['Past → present', 'if + past perfect', 'would + base verb', 'If I had taken that job, I would be rich now.'],
            ['Present → past', 'if + past simple', 'would have + past participle', 'If I were braver, I would have said something.'],
            ['Second (for comparison)', 'if + past simple', 'would + base verb', 'If I had money, I would buy it.'],
            ['Third (for comparison)', 'if + past perfect', 'would have + past participle', 'If I had had money, I would have bought it.'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('If I had studied medicine, I would be a doctor now.', 'Если бы я изучал медицину, сейчас я был бы врачом.'),
          ex('If she weren’t so shy, she would have asked him out.', 'Если бы она не была такой застенчивой, она бы пригласила его на свидание.'),
          ex('If we had left earlier, we wouldn’t be stuck in traffic now.', 'Если бы мы выехали раньше, мы бы сейчас не стояли в пробке.'),
          ex('If he were more organised, he would have finished on time.', 'Будь он организованнее, он закончил бы вовремя.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'If I would have studied, I would be a doctor now.', right: 'If I had studied, I would be a doctor now.', why: 'Never use would in the if-clause. Use the past perfect for a past cause.' },
      { wrong: 'If we left earlier, we wouldn’t be stuck in traffic now.', right: 'If we had left earlier, we wouldn’t be stuck in traffic now.', why: 'A cause in the past needs the past perfect in the if-clause.' },
      { wrong: 'If I would be taller, I would have joined the team.', right: 'If I were taller, I would have joined the team.', why: 'Use the past simple (were) for the present state.' },
    ],
    quiz: [
      choice('mc-1', 'If I had taken that job, I ___ rich now.', ['would be', 'would have been', 'will be'], 0, 'Past cause, present result: would + base verb.'),
      choice('mc-2', 'Which sentence mixes a present condition with a past result?', ['If I were taller, I would have joined the team.', 'If I had been taller, I would have joined the team.', 'If I were taller, I would join the team.'], 0, 'if + past simple, would have + past participle.'),
      fill('mc-3', 'If we had left earlier, we wouldn’t ___ stuck in traffic now. (be)', ['be'], 'Present result: would not + base verb.'),
      choice('mc-4', 'You did not study medicine, but you want to say what would be true now. Which is correct?', ['If I would have studied, I would be a doctor now.', 'If I had studied, I would be a doctor now.', 'If I studied, I would be a doctor now.'], 1, 'Past cause (past perfect), present result (would + base).'),
      fill('mc-5', 'If I had saved more money, I might ___ a house now. (have)', ['have'], 'Might + base verb for a possible present result.'),
    ],
    related: ['first-second-conditional', 'inversion'],
  },
  {
    slug: 'subjunctive',
    level: 'C2',
    title: 'The subjunctive mood',
    summary:
      'Understand the English subjunctive: the mandative form (I suggest that he be), the were-subjunctive (If I were), and fixed expressions like so be it.',
    youglish: 'I suggest that he',
    rules: [
      'The mandative subjunctive is the base form of the verb after words of demand, suggestion or necessity + that: I suggest that he be present.',
      'It has no -s and no tense: It is vital that she arrive on time. The negative is not + base verb: I insisted that he not go.',
      'British English often uses should instead: I suggest that he should be present. American English prefers the bare form.',
      'The were-subjunctive marks unreal situations: If I were you. I wish it were Friday. He talks as though he were the boss.',
      'Fixed formulas survive: so be it, come what may, long live the king, far be it from me, suffice it to say.',
      'It is formal. In everyday speech many speakers use the indicative or a to-infinitive instead.',
    ],
    sections: [
      {
        heading: 'Mandative subjunctive',
        table: {
          head: ['Trigger', 'Example'],
          rows: [
            ['suggest, recommend, propose', 'The doctor recommended that she rest.'],
            ['insist, demand, require, request', 'They demanded that he resign.'],
            ['it is essential, vital, important, necessary that', 'It is essential that every student be informed.'],
            ['negative: not + base verb', 'We suggested that he not travel alone.'],
          ],
        },
      },
      {
        heading: 'Were-subjunctive and fixed phrases',
        examples: [
          ex('I suggest that he be present at the meeting.', 'Предлагаю, чтобы он присутствовал на встрече.'),
          ex('It is vital that she arrive on time.', 'Крайне важно, чтобы она пришла вовремя.'),
          ex('I wish it were Friday.', 'Хотел бы я, чтобы сегодня была пятница.'),
          ex('He acts as if he were the manager.', 'Он ведёт себя так, будто он начальник.'),
          ex('Come what may, we will finish.', 'Что бы ни случилось, мы закончим.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'I suggest that he is present.', right: 'I suggest that he be present.', why: 'Formal English uses the base form (or should + base) after suggest.' },
      { wrong: 'It is essential that she arrives early.', right: 'It is essential that she arrive early.', why: 'The subjunctive has no -s, even with she, he and it.' },
      { wrong: 'He insisted that she doesn’t go.', right: 'He insisted that she not go.', why: 'The subjunctive negative is not + base verb, with no do-support.' },
    ],
    quiz: [
      choice('sub-1', 'The manager insisted that every employee ___ the form.', ['sign', 'signs', 'signed'], 0, 'Subjunctive: base form with no -s.'),
      choice('sub-2', 'It is essential that he ___ on time.', ['is', 'be', 'will be'], 1, 'The mandative subjunctive uses the base form: be.'),
      fill('sub-3', 'I wish it ___ Friday today. (be, were-subjunctive)', ['were'], 'After wish, use were for every person.'),
      choice('sub-4', 'Which phrase is a fixed subjunctive expression?', ['so be it', 'so is it', 'so it is'], 0, 'So be it preserves the old subjunctive be.'),
      choice('sub-5', 'They recommended that she ___ the offer.', ['not accept', 'does not accept', 'not accepts'], 0, 'Subjunctive negative: not + base verb.'),
    ],
    related: ['mixed-conditionals', 'cleft-sentences'],
  },
  {
    slug: 'cleft-sentences',
    level: 'C2',
    title: 'Cleft sentences',
    summary:
      'Use cleft sentences to focus information: it-clefts (It was Tom who called), wh-clefts (What I need is a break) and reversed forms. Patterns and a quiz.',
    youglish: 'what I need is',
    rules: [
      'A cleft sentence splits one clause into two parts to put the focus on one piece of information.',
      'It-cleft: It + be + focus + who/that + clause. It was Maria who solved the problem.',
      'Wh-cleft: What + clause + be + focus. What I need is a long holiday.',
      'Reversed wh-cleft: focus + be + what-clause. A long holiday is what I need.',
      'All-cleft: All I want is some peace and quiet.',
      'Reason cleft: The reason I called is that I need your help.',
      'Clefts add emphasis or contrast, or correct information. Do not use them in every sentence.',
    ],
    sections: [
      {
        heading: 'Patterns',
        table: {
          head: ['Type', 'Pattern', 'Example'],
          rows: [
            ['It-cleft (person)', 'It + be + person + who + clause', 'It was my sister who broke the vase.'],
            ['It-cleft (time, place)', 'It + be + time or place + that + clause', 'It was in Paris that they first met.'],
            ['Wh-cleft', 'What + clause + be + focus', 'What annoys me is the noise.'],
            ['Reversed wh-cleft', 'focus + be + what + clause', 'The noise is what annoys me.'],
            ['All-cleft', 'All + clause + be + focus', 'All I need is a quiet room.'],
            ['Reason cleft', 'The reason + clause + be + that + clause', 'The reason I left is that the pay was poor.'],
          ],
        },
      },
      {
        heading: 'In use',
        examples: [
          ex('It was John who called me last night.', 'Это Джон позвонил мне вчера вечером.'),
          ex('What I really need is a holiday.', 'Что мне действительно нужно, так это отпуск.'),
          ex('It was in Paris that they first met.', 'Именно в Париже они впервые встретились.'),
          ex('All I want is some peace and quiet.', 'Всё, чего я хочу, это тишина и покой.'),
          ex('What surprised me was how quickly she replied.', 'Меня удивило то, как быстро она ответила.'),
        ],
      },
    ],
    mistakes: [
      { wrong: 'It was John which called me.', right: 'It was John who called me.', why: 'Use who for a person in an it-cleft.' },
      { wrong: 'What I need it is a holiday.', right: 'What I need is a holiday.', why: 'The what-clause is the subject. Do not add it.' },
      { wrong: 'It was yesterday when I saw him.', right: 'It was yesterday that I saw him.', why: 'After a time or place focus, the standard link is that.' },
    ],
    quiz: [
      choice('cl-1', 'It was Maria ___ solved the problem.', ['which', 'who', 'what'], 1, 'Use who for a person in an it-cleft.'),
      choice('cl-2', 'Which sentence is a wh-cleft?', ['What I need is a holiday.', 'It was a holiday that I needed.', 'I needed a holiday.'], 0, 'What + clause + be + focus.'),
      fill('cl-3', 'All I want ___ some peace and quiet.', ['is'], 'The all-clause is singular and takes is.'),
      choice('cl-4', 'It was in Paris ___ they first met.', ['that', 'what', 'who'], 0, 'After a place focus, link with that.'),
      choice('cl-5', 'Reverse the wh-cleft: “What annoys me is the noise.”', ['The noise is what annoys me.', 'The noise what annoys me is.', 'What the noise annoys me.'], 0, 'Reversed wh-cleft: focus + be + what-clause.'),
    ],
    related: ['inversion', 'subjunctive'],
  },
]
