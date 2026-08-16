export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36">
      <defs>
        <linearGradient id="xrc-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="32" height="32" rx="8" fill="url(#xrc-lg)" opacity="0.15" />
      <path d="M9 25 18 7l9 18h-5.2L18 16l-3.8 9H9z" fill="#e2e8f0" />
      <circle cx="27" cy="9" r="2.4" fill="#22d3ee" />
    </svg>
  );
}
