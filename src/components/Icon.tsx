import type { CSSProperties } from 'react'

export type IconName =
  | 'dumbbell' | 'list' | 'chart' | 'sliders' | 'timer' | 'check' | 'plus'
  | 'close' | 'pencil' | 'trash' | 'download' | 'upload' | 'sparkles'
  | 'file' | 'flask' | 'chevronLeft' | 'play' | 'info' | 'calendar' | 'copy'

const PATHS: Record<IconName, JSX.Element> = {
  dumbbell: <><path d="M6.5 8v8M4 10v4M17.5 8v8M20 10v4M6.5 12h11" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  chart: <><path d="M4 19V5M4 19h16" /><path d="M7 15l4-4 3 2 5-6" /></>,
  sliders: <><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2" /><circle cx="9" cy="16" r="2" /></>,
  timer: <><circle cx="12" cy="14" r="8" /><path d="M12 14V9.5" /><path d="M9.5 2.5h5" /><path d="M12 2.5V6" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  download: <><path d="M12 4v10M8 11l4 4 4-4M5 19h14" /></>,
  upload: <><path d="M12 20V9M8 12l4-4 4 4M5 5h14" /></>,
  sparkles: <><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" /><path d="M18.5 14l.7 2L21 16.7l-1.8.7-.7 2-.7-2L16 17.4l1.8-.7.7-2z" /></>,
  file: <><path d="M14 3H6v18h12V7l-4-4z" /><path d="M14 3v4h4" /></>,
  flask: <><path d="M9.5 3h5M10.5 3v6l-4.6 8.2A2 2 0 007.7 20h8.6a2 2 0 001.8-2.8L13.5 9V3" /><path d="M8.3 14.5h7.4" /></>,
  chevronLeft: <><path d="M15 5l-7 7 7 7" /></>,
  play: <><path d="M7 5l12 7-12 7V5z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6h.01" /></>,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M8 3v4M16 3v4" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
}

interface Props {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
  strokeWidth?: number
}

export function Icon({ name, size = 22, className, style, strokeWidth = 1.8 }: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
