import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { pageMetadata } from '@/lib/seo/metadata'
import { contactEmail, SITE } from '@/lib/seo/site'

export const metadata = pageMetadata({
  title: 'Privacy policy',
  description: `What ${SITE.name} stores about you, which services process it, and how to export or delete it.`,
  path: '/privacy',
})

// TEMPLATE. It describes what this codebase actually does, but it is not legal advice:
// fill in the operator details below and have it reviewed for the places you serve (GDPR, UK GDPR, CCPA, ...).
const OPERATOR = '[Operator name and postal address]'

export default function PrivacyPage() {
  const email = contactEmail()
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Privacy policy' }]} />
      <h1 className="title-xl">Privacy policy</h1>

      <p role="note" className="panel measure mt-6 text-sm">
        This is a template. Before launch, replace the bracketed operator details and have the text reviewed by a lawyer for the
        countries you serve.
      </p>

      <div className="measure mt-10 space-y-10">
        <section aria-labelledby="who-heading">
          <h2 id="who-heading" className="title-md">
            Who is responsible
          </h2>
          <p className="reading mt-3">
            {SITE.name} is operated by {OPERATOR}.{' '}
            {email ? (
              <>
                You can reach us at <a href={`mailto:${email}`}>{email}</a>.
              </>
            ) : (
              '[Contact email]'
            )}
          </p>
        </section>

        <section aria-labelledby="without-heading">
          <h2 id="without-heading" className="title-md">
            Without an account
          </h2>
          <p className="reading mt-3">
            You can look up words and use the grammar lessons, dictation, speaking and drills without signing in. Your progress
            then stays in nothing but your open page. We count how often a word is looked up, once per browser session, without
            storing who looked it up. Your theme choice (light or dark) is kept in your browser’s local storage and never sent to
            us.
          </p>
        </section>

        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className="title-md">
            With an account
          </h2>
          <p className="reading mt-3">If you create an account we store:</p>
          <ul className="reading mt-2 list-disc space-y-1 pl-6">
            <li>your email address and, if you sign in with Google, the name and email Google shares;</li>
            <li>your settings: name, language, English level, daily goal and time zone;</li>
            <li>your saved words and your review history, which powers the spaced-repetition schedule;</li>
            <li>your quiz, dictation, speaking and drill results, your XP, level and streak.</li>
          </ul>
          <p className="reading mt-3">
            We use this only to run the features you see: syncing your deck, scheduling reviews and showing your progress. We do not
            sell it and do not show advertising. A sign-in cookie, set by our authentication provider, keeps you signed in. It is
            strictly necessary for signing in.
          </p>
        </section>

        <section aria-labelledby="processors-heading">
          <h2 id="processors-heading" className="title-md">
            Services that process data for us
          </h2>
          <ul className="reading mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Supabase</strong> hosts the database and authentication for accounts.
            </li>
            <li>
              <strong>Anthropic</strong> receives the text of your tutor messages, your practice topics and the words you ask to
              translate, only when you use those features while signed in, to write the answer. See{' '}
              <a href="https://www.anthropic.com/legal/privacy" rel="noopener noreferrer">
                Anthropic’s privacy policy
              </a>
              . Do not type personal information into the tutor.
            </li>
            <li>
              <strong>Google</strong> signs you in if you choose “Continue with Google”, under{' '}
              <a href="https://policies.google.com/privacy" rel="noopener noreferrer">
                Google’s privacy policy
              </a>
              .
            </li>
            <li>
              <strong>Our hosting provider</strong> processes requests and keeps technical logs such as IP addresses and error
              reports for security and reliability. [Name of host and retention period.]
            </li>
          </ul>
        </section>

        <section aria-labelledby="third-heading">
          <h2 id="third-heading" className="title-md">
            Content from other services
          </h2>
          <p className="reading mt-3">
            Dictionary data is fetched by our servers from Wiktionary through the Free Dictionary API and from Datamuse. Those
            requests contain only the word, never anything about you.
          </p>
          <p className="reading mt-3">
            Video is loaded only when you press “Hear it in real videos” or “Play clip”. Then{' '}
            <a href="https://youglish.com" rel="noopener noreferrer">
              YouGlish
            </a>{' '}
            and YouTube, which belongs to Google, load in your browser and may set cookies and receive your IP address. By
            pressing the button you also accept the{' '}
            <a href="https://www.youtube.com/t/terms" rel="noopener noreferrer">
              YouTube Terms of Service
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/privacy" rel="noopener noreferrer">
              Google’s privacy policy
            </a>
            .
          </p>
          <p className="reading mt-3">
            Speaking practice uses your browser’s speech recognition. Depending on the browser, your recording goes to its maker’s
            speech service (for example Google for Chrome). We receive only the recognised text.
          </p>
        </section>

        <section aria-labelledby="rights-heading">
          <h2 id="rights-heading" className="title-md">
            Your choices
          </h2>
          <ul className="reading mt-3 list-disc space-y-2 pl-6">
            <li>
              <strong>Export:</strong> download your saved words from <Link href="/deck">My words</Link> in a format Anki and
              spreadsheets can open.
            </li>
            <li>
              <strong>Correct:</strong> change your name, language, level, goal and time zone in <Link href="/settings">Settings</Link>.
            </li>
            <li>
              <strong>Delete:</strong> “Delete your account” in <Link href="/settings">Settings</Link> removes your profile, deck,
              progress and history immediately. Backups made by our database host expire on their own schedule. [State it.]
            </li>
            <li>
              Depending on where you live you may have further rights, such as to object or to complain to a data-protection
              authority. [Describe how to exercise them.]
            </li>
          </ul>
        </section>

        <section aria-labelledby="kids-heading">
          <h2 id="kids-heading" className="title-md">
            Children
          </h2>
          <p className="reading mt-3">
            {SITE.name} is not directed at children under 13, and we do not knowingly collect their data. If you believe a child has
            created an account, contact us and we will delete it.
          </p>
        </section>

        <section aria-labelledby="changes-heading">
          <h2 id="changes-heading" className="title-md">
            Changes
          </h2>
          <p className="reading mt-3">
            If this policy changes in a way that matters, we will update this page and, for account holders, tell you in the app.
            Last updated: [date].
          </p>
        </section>
      </div>
    </div>
  )
}
