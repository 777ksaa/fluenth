import Link from 'next/link'
import { SITE } from '@/lib/seo/site'
import { SearchIcon } from './icons'
import { NavLinks } from './nav-links'
import { SearchBox } from './search-box'
import { ThemeToggle } from './theme-toggle'
import { UserChip } from './user-chip'

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2.5 18.5 11 12 21.5 5.5 11z" />
      <path d="M12 8.5v6" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="page flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold text-ink no-underline" aria-label={`${SITE.name}, home`}>
          <span className="text-pen">
            <Logo />
          </span>
          {SITE.name}
        </Link>
        <nav aria-label="Sections" className="hidden md:block">
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-56 lg:block">
            <SearchBox size="compact" />
          </div>
          <Link href="/vocabulary" className="btn btn-quiet btn-icon lg:hidden" aria-label="Search the dictionary">
            <SearchIcon />
          </Link>
          <ThemeToggle />
          <UserChip />
        </div>
      </div>
    </header>
  )
}
