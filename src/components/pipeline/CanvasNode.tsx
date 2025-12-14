import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Settings2, X, GripVertical } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { AIHelpTooltip } from "./AIHelpTooltip";
import { BlockType } from "./DraggableBlock";
import { ParsedData } from "./DatasetUpload";

export type NodeStatus = "pending" | "configured" | "completed";

interface CanvasNodeProps {
  id: BlockType;
  title: string;
  description: string;
  helpText: string;
  icon: LucideIcon;
  color: string;
  glowColor: string;
  borderColor: string;
  status: NodeStatus;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  position: { x: number; y: number };
  gridSize?: number;
  dataset?: ParsedData | null;
  children?: React.ReactNode;
}

const statusConfig = {
  pending: { icon: Clock, label: "Not configured", className: "bg-muted text-muted-foreground" },
  configured: { icon: Settings2, label: "Configured", className: "bg-primary/20 text-primary" },
  completed: { icon: Check, label: "Completed", className: "bg-accent/20 text-accent" },
};

export function CanvasNode({
  id,
  title,
  description,
  helpText,
  icon: Icon,
  color,
  glowColor,
  borderColor,
  status,
  isActive,
  onClick,
  onRemove,
  onPositionChange,
  position,
  gridSize = 32,
  dataset,
  children,
}: CanvasNodeProps) {
  const StatusIcon = statusConfig[status].icon;
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const snapToGrid = useCallback(
    (value: number) => Math.round(value / gridSize) * gridSize,
    [gridSize]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag if clicking on the drag handle area or empty space
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const rect = nodeRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffsetRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        setIsDragging(true);
      }
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onPositionChange) return;

      const canvas = document.getElementById("pipeline-canvas");
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const newX = e.clientX - canvasRect.left - dragOffsetRef.current.x;
      const newY = e.clientY - canvasRect.top - dragOffsetRef.current.y;

      const snappedX = snapToGrid(Math.max(0, Math.min(newX, canvasRect.width - 288)));
      const snappedY = snapToGrid(Math.max(0, Math.min(newY, canvasRect.height - 200)));

      onPositionChange({ x: snappedX, y: snappedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, snapToGrid, onPositionChange]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute w-72 glass-card rounded-2xl overflow-hidden transition-all",
        isDragging ? "cursor-grabbing scale-105 z-50 shadow-2xl" : "cursor-grab",
        borderColor,
        isActive && glowColor,
        isActive && "ring-2 ring-offset-2 ring-offset-background ring-primary"
      )}
      style={{
        left: position.x,
        top: position.y,
        transition: isDragging ? "none" : "all 0.2s ease-out",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="absolute top-3 left-3 p-1 rounded bg-background/30 opacity-50 hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-foreground/50" />
      </div>

      {/* Header */}
      <div className={cn("p-4 pl-10 border-b border-border/50", color)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/20 backdrop-blur flex items-center justify-center">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{title}</h3>
              <p className="text-xs text-foreground/70">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AIHelpTooltip 
              stepType={id} 
              dataset={dataset || null} 
              staticHelp={helpText} 
            />
            {onRemove && (
              <button
                className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="w-4 h-4 text-foreground/70 hover:text-destructive" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="px-4 py-2 border-b border-border/30 cursor-pointer" onClick={onClick}>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            statusConfig[status].className
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig[status].label}
        </div>
      </div>

      {/* Content */}
      {children && (
        <div className="p-4 cursor-pointer" onClick={onClick}>
          {children}
        </div>
      )}

      {/* Connection Points */}
      <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground" />
    </div>
  );
}
