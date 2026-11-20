'use client'

import { MoonIcon, SunIcon } from './icons'

/** The <html> class is set before first paint by the inline script in app/layout.tsx. */
export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle('dark')
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }

  return (
    <button type="button" onClick={toggle} className="btn btn-quiet btn-icon" aria-label="Toggle dark mode">
      <span className="dark:hidden"><MoonIcon /></span>
      <span className="hidden dark:inline"><SunIcon /></span>
    </button>
  )
}
