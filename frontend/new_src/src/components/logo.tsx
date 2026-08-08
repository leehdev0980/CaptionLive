export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        stroke="currentColor"
        className="text-signal/40"
      />
      <g
        className="text-signal"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="12" y1="12" x2="12" y2="20" />
        <line x1="16" y1="8" x2="16" y2="24" />
        <line x1="20" y1="11" x2="20" y2="21" />
        <line x1="24" y1="14" x2="24" y2="18" />
      </g>
    </svg>
  );
}
