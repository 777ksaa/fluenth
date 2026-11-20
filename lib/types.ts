// Shapes shared between server actions and client components.

export interface XpResult {
  awarded: number
  total: number
  level: number
  streak: number
  leveledUp: boolean
}

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: 'auth' | 'invalid' | 'limit' | 'failed'; message?: string }

export interface ProfileSummary {
  display_name: string | null
  xp: number
  level: number
  streak_current: number
  last_active_date: string | null
  timezone: string
  daily_goal_xp: number
  cefr_level: string
  native_lang: string
}

export interface CardRow {
  id: string
  word: string
  part_of_speech: string | null
  definition: string
  example: string | null
  translation: string | null
  audio_url: string | null
  state: 'new' | 'learning' | 'review' | 'relearning'
  learning_step: number
  ease_factor: number | string
  interval_days: number
  repetitions: number
  lapses: number
  due_at: string
}

export interface AuthState {
  error?: string
  message?: string
}
