'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/vocabulary', label: 'Vocabulary' },
  { href: '/grammar', label: 'Grammar' },
  { href: '/practice', label: 'Practice' },
  { href: '/review', label: 'Review' },
]

export function NavLinks() {
  const pathname = usePathname()
  return (
    <ul className="flex items-center gap-1">
      {LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="nav-link" aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
