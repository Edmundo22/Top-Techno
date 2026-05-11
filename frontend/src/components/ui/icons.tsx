import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true as const,
};

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M12 22s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function HexIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M4 20h4l10-10-4-4L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M12 3l9 5-9 5-9-5 9-5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 13l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M4 21V7l8-4 8 4v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 21V11h6v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function PolygonOutlineIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M5 8l5-4 9 3-3 10-9 1-2-10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PoiIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 22c4-4.5 7-8 7-12a7 7 0 1 0-14 0c0 4 3 7.5 7 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 6.2A10 10 0 0 1 12 6c6 0 10 7 10 7a17 17 0 0 1-3.4 4M6.6 6.6C3.8 8.5 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.4-1.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path
        d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
