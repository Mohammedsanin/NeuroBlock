import { cn } from "@/lib/utils";

interface ConnectorProps {
  isActive?: boolean;
  direction?: "horizontal" | "vertical";
}

export function Connector({ isActive, direction = "horizontal" }: ConnectorProps) {
  if (direction === "horizontal") {
    return (
      <div className="flex items-center justify-center w-16 h-8">
        <svg width="64" height="32" className="overflow-visible">
          <defs>
            <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path
            d="M 0 16 C 20 16, 20 16, 32 16 C 44 16, 44 16, 64 16"
            className={cn(
              "connector-line",
              isActive && "connector-line-animated"
            )}
            stroke="url(#connector-gradient)"
          />
          <circle
            cx="32"
            cy="16"
            r="3"
            fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted))"}
            className={cn(isActive && "animate-pulse-glow")}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-8 h-12">
      <svg width="32" height="48" className="overflow-visible">
        <defs>
          <linearGradient id="connector-gradient-v" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M 16 0 C 16 15, 16 15, 16 24 C 16 33, 16 33, 16 48"
          className={cn(
            "connector-line",
            isActive && "connector-line-animated"
          )}
          stroke="url(#connector-gradient-v)"
        />
        <circle
          cx="16"
          cy="24"
          r="3"
          fill={isActive ? "hsl(var(--primary))" : "hsl(var(--muted))"}
          className={cn(isActive && "animate-pulse-glow")}
        />
      </svg>
    </div>
  );
}
