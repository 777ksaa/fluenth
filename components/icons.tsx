// A small set of 24px line icons, drawn for this project. Decorative: always aria-hidden,
// so put the accessible name on the button or link that contains them.

import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

function Svg({ size = 20, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Svg>
)
export const SunIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></Svg>
)
export const MoonIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></Svg>
)
export const FlameIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3c.8 3.4 5 5.4 5 10a5 5 0 0 1-10 0c0-2 .9-3.2 2-4.2.2 1.6.9 2.4 2 2.4 0-3-.6-5 1-8.2z" /></Svg>
)
export const SpeakerIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 9.5v5h4l5 4v-13l-5 4H4z" /><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" /></Svg>
)
export const MicIcon = (p: IconProps) => (
  <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Svg>
)
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
)
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)
export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const BookmarkIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 4h10v16l-5-3.5L7 20V4z" /></Svg>
)
export const PlayIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 5.5v13l11-6.5-11-6.5z" /></Svg>
)
export const PenIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" /></Svg>
)
export const HeadphonesIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3.5" y="14" width="4" height="6" rx="1.5" /><rect x="16.5" y="14" width="4" height="6" rx="1.5" /></Svg>
)
export const SparkIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3l2.2 6.3L20.5 11l-6.3 1.7L12 19l-2.2-6.3L3.5 11l6.3-1.7L12 3z" /></Svg>
)
export const UserIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></Svg>
)
export const PrinterIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 8V4h10v4M7 17H5v-6h14v6h-2" /><rect x="7" y="14" width="10" height="6" /></Svg>
)
export const CardsIcon = (p: IconProps) => (
  <Svg {...p}><rect x="4" y="6" width="13" height="12" rx="2" /><path d="M8 3.5h11a1.5 1.5 0 0 1 1.5 1.5v10" /></Svg>
)
export const LayersIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>
)
export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}><path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" /></Svg>
)
