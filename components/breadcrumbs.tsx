import Link from 'next/link'

export interface Crumb {
  name: string
  /** Omit on the current page. */
  href?: string
}

/** Visible trail. Pair it with breadcrumbJsonLd() so search engines get the same hierarchy. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-print mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="text-muted">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.name}
              </span>
            )}
            {i < items.length - 1 ? <span aria-hidden="true">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
