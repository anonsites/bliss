import { useId, type CSSProperties, type ReactNode } from "react";

interface GreenRingProps {
  children: ReactNode;
  mode: "fill" | "unfill";
  size?: number;
}

export function GreenRing({ children, mode, size = 70 }: GreenRingProps) {
  const gradientId = useId();
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const length = 2 * Math.PI * radius;
  const style = { "--green-ring-length": length, width: size, height: size } as CSSProperties;

  return (
    <span className={`green-ring green-ring--${mode}`} style={style}>
      <svg aria-hidden="true" className="green-ring__svg" viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--highlight)" />
          </linearGradient>
        </defs>

        <circle className="green-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="green-ring__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
        />
      </svg>

      <span className="green-ring__content">{children}</span>
    </span>
  );
}
