import type { CSSProperties } from 'react'
import { describeDiff } from '@/lib/core/diff'
import type { DiffToken } from '@/lib/core/diff'

const show = (word: string | undefined, first: boolean): string => {
  const w = (word ?? '').replace(/^i(?=$|')/, 'I') // the diff lower-cases everything
  return first ? w.charAt(0).toUpperCase() + w.slice(1) : w
}

/**
 * A teacher's red-pen markup of the learner's answer: wrong words struck through with the
 * correction written above, missing words as a gap with the word above it, extra words struck out.
 * The visual layer is hidden from screen readers; they get the same information as plain sentences.
 */
export function Correction({ tokens }: { tokens: DiffToken[] }) {
  const notes = describeDiff(tokens)
  return (
    <div>
      <p className="marked" aria-hidden="true">
        {tokens.map((t, i) => {
          const style = { '--i': i } as CSSProperties
          const first = i === 0
          let node
          if (t.status === 'correct') node = <span>{show(t.expected, first)}</span>
          else if (t.status === 'missing') {
            node = (
              <span className="fix-gap" style={style}>
                <span>{show(t.expected, first)}</span>
              </span>
            )
          } else if (t.status === 'extra') node = <span className="fix-extra">{show(t.got, first)}</span>
          else {
            node = (
              <span className="fix">
                <span className={t.status === 'typo' ? 'fix-typo' : 'fix-wrong'} style={style}>
                  {show(t.got, first)}
                </span>
                <span className="fix-right" style={style}>
                  {show(t.expected, first)}
                </span>
              </span>
            )
          }
          return (
            <span key={i}>
              {node}{' '}
            </span>
          )
        })}
      </p>
      <p className="sr-only">{notes.length > 0 ? notes.join(' ') : 'Every word is correct.'}</p>
    </div>
  )
}
