import { Breadcrumbs } from '@/components/breadcrumbs'
import { PracticeGenerator } from '@/components/practice-generator'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'AI practice exercises on any topic',
  description: 'Type any grammar or vocabulary topic and get a fresh set of exercises at your level, with instant feedback.',
  path: '/practice',
  noindex: true,
})

export default function PracticePage() {
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Practice' }]} />
      <h1 className="title-xl">Practice on any topic</h1>
      <p className="lead measure mt-4">
        Name a topic and your level and get six new questions. Run it again for a different set whenever you want more.
      </p>
      <div className="measure mt-10">
        <PracticeGenerator />
      </div>
    </div>
  )
}
