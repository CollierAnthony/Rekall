import type { ReactElement } from 'react';

export type IconName =
  | 'arrow'
  | 'back'
  | 'calendar'
  | 'chevronDown'
  | 'close'
  | 'check'
  | 'external'
  | 'flag'
  | 'library'
  | 'lock'
  | 'mic'
  | 'minus'
  | 'search'
  | 'timer';

const SHAPES: Readonly<Record<IconName, ReactElement>> = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  flag: <path d="M5.5 21V4.5h11.5l-2.2 4.2 2.2 4.3H5.5" />,
  library: (
    <>
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <rect x="8.5" y="4" width="4" height="16" rx="1" />
      <path d="M14.6 5.3l3.5-.9 3.9 14.8-3.5.9z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  minus: <path d="M7 12h10" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 10v3.5l2.3 1.6M9.5 3h5" />
    </>
  ),
};

type IconProps = {
  readonly name: IconName;
  readonly size?: number;
  readonly strokeWidth?: number;
};

/** Icône en trait, décorative : le texte ou l'aria-label du contrôle qui la porte dit ce qu'elle fait. */
export function Icon({ name, size = 20, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {SHAPES[name]}
    </svg>
  );
}
