"use client";

const SHAPES = {
  star: "M32 8.5l5.7 12.2 13.5 2-9.7 9.5 2.3 13.5L32 34.6 17.2 46.7l2.3-13.5-9.7-9.5 13.5-2L32 8.5z",
  flame: "M32 8C24 16 24 22 24 26c0 4.7 3 8 8 8s8-3.3 8-8c0-5-4-9-8-12 0 0-4 4-8 6z",
  shield: "M12 4v6c0 8 10 10 10 10s10-2 10-10V4H12z",
  crescent: "M40 12c-10 0-18 8-18 18 0 9 6 16 16 18 0 0-12-4-12-18 0-10 8-18 18-18 0 0-2 0-4 0z",
  book: "M8 8h12a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2H8V8z",
} as const;

type ShapeKey = keyof typeof SHAPES;

export function getBadgeShape(id: string): ShapeKey {
  if (id === "first_prayer") return "book";
  if (id === "streak_7" || id === "streak_30") return "flame";
  if (id === "perfect_day" || id === "night_owl" || id === "consistent") return "crescent";
  if (id.startsWith("points_")) return "shield";
  return "star";
}

interface Props {
  shape: ShapeKey;
  earned?: boolean;
  className?: string;
}

export default function RewardBadgeIcon({ shape, earned = false, className = "" }: Props) {
  const maskId = `badge-mask-${shape}`;
  const shineId = `badge-shine-${shape}`;
  const fillId = `badge-fill-${shape}`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`.trim()}>
      <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent-dark)" />
          </linearGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.65" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <path d={SHAPES[shape]} fill="white" />
          </mask>
        </defs>

        <path d={SHAPES[shape]} fill={earned ? `url(#${fillId})` : "currentColor"} />

        <rect
          x="-32"
          y="0"
          width="32"
          height="64"
          fill={`url(#${shineId})`}
          mask={`url(#${maskId})`}
          className={earned ? "badge-shine-overlay" : "opacity-0"}
        />
      </svg>
    </div>
  );
}
