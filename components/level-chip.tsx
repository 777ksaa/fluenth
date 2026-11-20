import type { Level } from '@/lib/core/levels'

/** CEFR level badge. The fill gets darker as the level rises (see .lv in globals.css). */
export function LevelChip({ level }: { level: Level | string }) {
  return (
    <span className="lv" data-level={level} title={`CEFR level ${level}`}>
      {level}
    </span>
  )
}
