// CEFR levels shared by grammar, dictation, dialogues and the profile.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type Level = (typeof LEVELS)[number]

export interface LevelInfo {
  level: Level
  name: string
  /** One plain-language "can do" statement for the roadmap. */
  canDo: string
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
  A1: { level: 'A1', name: 'Beginner', canDo: 'Introduce yourself, ask and answer simple questions, and understand basic everyday phrases.' },
  A2: { level: 'A2', name: 'Elementary', canDo: 'Handle routine tasks, describe your background and surroundings, and talk about the past and future in simple terms.' },
  B1: { level: 'B1', name: 'Intermediate', canDo: 'Deal with most situations while travelling, describe experiences and plans, and give reasons and opinions.' },
  B2: { level: 'B2', name: 'Upper-intermediate', canDo: 'Follow complex texts, speak fluently with native speakers, and argue a point of view clearly.' },
  C1: { level: 'C1', name: 'Advanced', canDo: 'Express ideas fluently and precisely, and use language flexibly for work, study and social purposes.' },
  C2: { level: 'C2', name: 'Mastery', canDo: 'Understand virtually everything, summarise from different sources, and express subtle shades of meaning.' },
}

export function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value)
}

/** "b2" or "B2" to "B2"; null for anything else. */
export function levelFromSlug(slug: string): Level | null {
  const upper = slug.toUpperCase()
  return isLevel(upper) ? upper : null
}

export const levelSlug = (level: Level): string => level.toLowerCase()
