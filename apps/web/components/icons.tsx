import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' };

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M4 7.5h15v11H4a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h12v4m3 4h3v4h-3a2 2 0 1 1 0-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 3 4.5 6v5.5c0 4.5 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5 7.5-9.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M14 4h6v6m0-6-9 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}
