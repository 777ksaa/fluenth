import Link from 'next/link'
import { SearchBox } from '@/components/search-box'

export default function WordNotFound() {
  return (
    <div className="page py-16 md:py-24">
      <h1 className="title-lg">No entry for that word</h1>
      <p className="lead measure mt-3">
        The dictionary has nothing under that spelling. Check it for typos, or try the base form: <em>run</em> instead of{' '}
        <em>running</em>. Idioms and phrasal verbs work too, for example <em>break the ice</em>.
      </p>
      <div className="measure mt-8">
        <SearchBox />
      </div>
      <p className="mt-8">
        <Link href="/vocabulary">Browse the dictionary</Link>
      </p>
    </div>
  )
}
