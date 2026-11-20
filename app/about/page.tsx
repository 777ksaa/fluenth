import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { JsonLd } from '@/components/json-ld'
import { breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { pageMetadata } from '@/lib/seo/metadata'
import { contactEmail, SITE } from '@/lib/seo/site'

export const metadata = pageMetadata({
  title: 'About and data sources',
  description: `How ${SITE.name} works, where its dictionary data comes from, how AI is used and what is licensed from whom.`,
  path: '/about',
})

export default function AboutPage() {
  const email = contactEmail()
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'About' }]} />
      <h1 className="title-xl">About {SITE.name}</h1>
      <p className="lead measure mt-4">
        {SITE.name} is a free place to learn English from A1 to C2. You can look up any word, read grammar lessons, practise
        dictation and speaking, and keep the words you want to remember in a flashcard deck. This page says where everything comes
        from.
      </p>

      <div className="measure mt-12 space-y-12">
        <section aria-labelledby="dictionary-heading">
          <h2 id="dictionary-heading" className="title-md">
            The dictionary
          </h2>
          <p className="reading mt-3">
            Definitions, parts of speech, example sentences, pronunciations and word origins come from{' '}
            <a href="https://en.wiktionary.org" rel="noopener noreferrer">
              Wiktionary
            </a>{' '}
            through the{' '}
            <a href="https://dictionaryapi.dev" rel="noopener noreferrer">
              Free Dictionary API
            </a>
            . Wiktionary text is available under the{' '}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noopener noreferrer">
              Creative Commons Attribution-ShareAlike 3.0
            </a>{' '}
            licence, and each entry links back to its source. Words with a similar meaning or the opposite meaning come from{' '}
            <a href="https://www.datamuse.com/api/" rel="noopener noreferrer">
              Datamuse
            </a>
            .
          </p>
          <p className="reading mt-3">
            An entry is only offered to search engines when it has at least two definitions and one example sentence. Thinner
            entries still work for learners but are marked so they do not crowd search results.
          </p>
        </section>

        <section aria-labelledby="lessons-heading">
          <h2 id="lessons-heading" className="title-md">
            Lessons, dictation and dialogues
          </h2>
          <p className="reading mt-3">
            The grammar lessons, quizzes, dictation sentences, dialogues and drills were written for this site. Example sentences
            are original. Grammar is organised by the Common European Framework levels, A1 to C2, so you can start where you are.
          </p>
        </section>

        <section aria-labelledby="video-heading">
          <h2 id="video-heading" className="title-md">
            Video of real speech
          </h2>
          <p className="reading mt-3">
            Videos are not hosted here. When you press “Hear it in real videos”, the page loads the{' '}
            <a href="https://youglish.com" rel="noopener noreferrer">
              YouGlish
            </a>{' '}
            player, which finds the word spoken in public YouTube videos. Nothing is requested from YouTube or YouGlish until you
            press the button.
          </p>
        </section>

        <section aria-labelledby="ai-heading">
          <h2 id="ai-heading" className="title-md">
            Where AI is used
          </h2>
          <p className="reading mt-3">
            The tutor, the practice generator and translations into your language are written by an AI model (Claude, from
            Anthropic) when you ask for them, and only if you are signed in. Each account has a daily limit. AI answers can contain
            mistakes, so they are labelled, and a translation is a starting point, not a final authority. Everything else on the
            site, including scoring, is done by ordinary programs.
          </p>
        </section>

        <section aria-labelledby="speech-heading">
          <h2 id="speech-heading" className="title-md">
            Listening and speaking
          </h2>
          <p className="reading mt-3">
            Reading text aloud and recognising your speech use your browser’s built-in speech features. Speech recognition works in
            Chrome, Edge and Safari, not in Firefox. In some browsers, such as Chrome, the recording is sent to the browser maker’s
            speech service to turn it into text. This site never receives the audio, only the text that was recognised.
          </p>
        </section>

        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="title-md">
            Corrections and questions
          </h2>
          <p className="reading mt-3">
            Found a mistake in a lesson or an entry?{' '}
            {email ? (
              <>
                Write to <a href={`mailto:${email}`}>{email}</a>.
              </>
            ) : (
              'Use the contact details of the site’s operator.'
            )}{' '}
            How your data is handled is described in the <Link href="/privacy">privacy policy</Link>.
          </p>
        </section>
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
    </div>
  )
}
