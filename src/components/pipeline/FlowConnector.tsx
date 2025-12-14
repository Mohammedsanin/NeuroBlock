import { cn } from "@/lib/utils";

interface FlowConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive?: boolean;
  isCompleted?: boolean;
}

export function FlowConnector({ from, to, isActive, isCompleted }: FlowConnectorProps) {
  const startX = from.x + 288; // Node width (w-72 = 288px)
  const startY = from.y + 60; // Approximate middle of node
  const endX = to.x;
  const endY = to.y + 60;

  // Calculate control points for bezier curve
  const midX = (startX + endX) / 2;

  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id={`gradient-${from.x}-${to.x}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            stopColor={isCompleted ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            stopOpacity={isActive || isCompleted ? 0.8 : 0.3}
          />
          <stop
            offset="100%"
            stopColor={isCompleted ? "hsl(var(--accent))" : "hsl(var(--primary))"}
            stopOpacity={isActive || isCompleted ? 0.8 : 0.3}
          />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      {(isActive || isCompleted) && (
        <path
          d={path}
          fill="none"
          stroke={isCompleted ? "hsl(var(--accent))" : "hsl(var(--primary))"}
          strokeWidth="8"
          strokeOpacity="0.2"
          filter="url(#glow)"
        />
      )}

      {/* Main line */}
      <path
        d={path}
        fill="none"
        stroke={`url(#gradient-${from.x}-${to.x})`}
        strokeWidth="3"
        strokeLinecap="round"
        className={cn(
          "transition-all duration-500",
          (isActive || isCompleted) && "animate-pulse-glow"
        )}
      />

      {/* Animated dots along path */}
      {isActive && !isCompleted && (
        <>
          <circle r="4" fill="hsl(var(--primary))">
            <animateMotion dur="2s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="4" fill="hsl(var(--primary))" opacity="0.5">
            <animateMotion dur="2s" repeatCount="indefinite" path={path} begin="0.5s" />
          </circle>
        </>
      )}

      {/* Completed checkmark at end */}
      {isCompleted && (
        <circle
          cx={endX - 8}
          cy={endY}
          r="6"
          fill="hsl(var(--accent))"
          className="animate-scale-bounce"
        />
      )}
    </svg>
  );
}
