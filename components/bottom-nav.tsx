'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CardsIcon, HeadphonesIcon, PenIcon, SearchIcon, UserIcon } from './icons'

const TABS = [
  { href: '/vocabulary', label: 'Words', Icon: SearchIcon },
  { href: '/grammar', label: 'Grammar', Icon: PenIcon },
  { href: '/practice', label: 'Practice', Icon: HeadphonesIcon },
  { href: '/review', label: 'Review', Icon: CardsIcon },
  { href: '/dashboard', label: 'Me', Icon: UserIcon },
]

/** Phone-sized navigation. Hidden from the md breakpoint up, where the header carries the links. */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main" className="tabbar md:hidden no-print">
      {TABS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="tab" aria-current={pathname.startsWith(href) ? 'page' : undefined}>
          <Icon size={22} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
