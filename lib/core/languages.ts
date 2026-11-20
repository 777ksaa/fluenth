// Languages learners can pick as their native language (used for AI translations).

export const LANG_NAMES: Record<string, string> = {
  ru: 'Russian',
  kk: 'Kazakh',
  uk: 'Ukrainian',
  uz: 'Uzbek',
  tr: 'Turkish',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pl: 'Polish',
  ar: 'Arabic',
  hi: 'Hindi',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
}

export const isSupportedLang = (code: string): boolean => Object.hasOwn(LANG_NAMES, code)
