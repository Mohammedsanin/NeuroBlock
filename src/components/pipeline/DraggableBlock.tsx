import { useDrag } from "react-dnd";
import { cn } from "@/lib/utils";
import { LucideIcon, Check, GripVertical } from "lucide-react";

export type BlockType = "dataset" | "preprocess" | "feature" | "split" | "model" | "results";

interface DraggableBlockProps {
  type: BlockType;
  icon: LucideIcon;
  label: string;
  hint?: string;
  colorClass?: string;
  isPlaced?: boolean;
}

// Background colors for each block type
const blockBgColors: Record<BlockType, string> = {
  dataset: "hover:bg-pipeline-data/10 border-pipeline-data/30",
  preprocess: "hover:bg-pipeline-clean/10 border-pipeline-clean/30",
  feature: "hover:bg-pipeline-feature/10 border-pipeline-feature/30",
  split: "hover:bg-pipeline-split/10 border-pipeline-split/30",
  model: "hover:bg-pipeline-model/10 border-pipeline-model/30",
  results: "hover:bg-pipeline-output/10 border-pipeline-output/30",
};

const blockPlacedColors: Record<BlockType, string> = {
  dataset: "bg-pipeline-data/5 border-pipeline-data/20",
  preprocess: "bg-pipeline-clean/5 border-pipeline-clean/20",
  feature: "bg-pipeline-feature/5 border-pipeline-feature/20",
  split: "bg-pipeline-split/5 border-pipeline-split/20",
  model: "bg-pipeline-model/5 border-pipeline-model/20",
  results: "bg-pipeline-output/5 border-pipeline-output/20",
};

export function DraggableBlock({ type, icon: Icon, label, hint, colorClass, isPlaced }: DraggableBlockProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "PIPELINE_BLOCK",
      item: { type },
      canDrag: !isPlaced,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [type, isPlaced]
  );

  return (
    <div
      ref={drag}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
        isDragging && "opacity-50 scale-95",
        isPlaced
          ? cn(blockPlacedColors[type], "cursor-default")
          : cn(
              "border-dashed bg-card cursor-grab active:cursor-grabbing hover:shadow-md",
              blockBgColors[type]
            )
      )}
    >
      {!isPlaced && (
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm",
          isPlaced ? colorClass : "text-foreground"
        )}>
          {label}
        </p>
        {hint && !isPlaced && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
        {isPlaced && (
          <p className={cn("text-xs flex items-center gap-1", colorClass)}>
            <Check className="w-3 h-3" /> Added!
          </p>
        )}
      </div>
    </div>
  );
}