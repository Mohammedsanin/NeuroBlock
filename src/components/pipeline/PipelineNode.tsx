import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Settings2 } from "lucide-react";

export type NodeStatus = "pending" | "configured" | "completed";
export type NodeType = "data" | "process" | "model" | "output";

interface PipelineNodeProps {
  title: string;
  description: string;
  icon: ReactNode;
  type: NodeType;
  status: NodeStatus;
  isActive?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

const nodeTypeStyles: Record<NodeType, string> = {
  data: "node-data",
  process: "node-process",
  model: "node-model",
  output: "node-output",
};

const glowStyles: Record<NodeType, string> = {
  data: "glow-blue",
  process: "glow-purple",
  model: "glow-orange",
  output: "glow-green",
};

const iconBgStyles: Record<NodeType, string> = {
  data: "gradient-data",
  process: "gradient-process",
  model: "gradient-model",
  output: "gradient-output",
};

const statusConfig = {
  pending: { icon: Clock, label: "Pending", class: "status-pending" },
  configured: { icon: Settings2, label: "Configured", class: "status-configured" },
  completed: { icon: Check, label: "Completed", class: "status-completed" },
};

export function PipelineNode({
  title,
  description,
  icon,
  type,
  status,
  isActive,
  onClick,
  children,
}: PipelineNodeProps) {
  const StatusIcon = statusConfig[status].icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        "node-card",
        nodeTypeStyles[type],
        isActive && glowStyles[type],
        isActive && "ring-2 ring-offset-2 ring-offset-background",
        type === "data" && isActive && "ring-pipeline-data",
        type === "process" && isActive && "ring-pipeline-process",
        type === "model" && isActive && "ring-pipeline-model",
        type === "output" && isActive && "ring-pipeline-output"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-foreground shrink-0",
            iconBgStyles[type]
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-semibold text-foreground truncate">
              {title}
            </h3>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                statusConfig[status].class
              )}
            >
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig[status].label}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
