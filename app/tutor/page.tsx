import { Breadcrumbs } from '@/components/breadcrumbs'
import { TutorChat } from '@/components/tutor-chat'
import { pageMetadata } from '@/lib/seo/metadata'

export const metadata = pageMetadata({
  title: 'AI English tutor',
  description: 'Ask an AI tutor about grammar, vocabulary and your own sentences.',
  path: '/tutor',
  noindex: true,
})

export default function TutorPage() {
  return (
    <div className="page py-8 md:py-12">
      <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Tutor' }]} />
      <h1 className="title-xl">AI tutor</h1>
      <p className="lead measure mt-4">
        Ask why a sentence is wrong, what a word means, or for more practice. Explanations are short and match your level.
      </p>
      <div className="measure mt-10">
        <TutorChat />
      </div>
    </div>
  )
}
