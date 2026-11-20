import Link from 'next/link'
import { SearchBox } from '@/components/search-box'

export default function NotFound() {
  return (
    <div className="page py-16 md:py-24">
      <h1 className="title-lg">That page doesn&apos;t exist</h1>
      <p className="lead measure mt-3">
        The link may be old or mistyped. Look up a word instead, or pick a section below.
      </p>
      <div className="measure mt-8">
        <SearchBox />
      </div>
      <ul className="mt-10 flex flex-wrap gap-3">
        <li><Link className="btn btn-quiet" href="/vocabulary">Dictionary</Link></li>
        <li><Link className="btn btn-quiet" href="/grammar">Grammar</Link></li>
        <li><Link className="btn btn-quiet" href="/practice">Practice</Link></li>
      </ul>
    </div>
  )
}
