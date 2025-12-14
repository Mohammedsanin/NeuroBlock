import { useDrop } from "react-dnd";
import { cn } from "@/lib/utils";
import { BlockType } from "./DraggableBlock";
import { MousePointerClick, ArrowRight } from "lucide-react";

interface DropCanvasProps {
  onDrop: (type: BlockType, position: { x: number; y: number }) => void;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export function DropCanvas({ onDrop, children, isEmpty }: DropCanvasProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "PIPELINE_BLOCK",
    drop: (item: { type: BlockType }, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = document.getElementById("pipeline-canvas")?.getBoundingClientRect();
      
      if (offset && canvasRect) {
        const x = offset.x - canvasRect.left - 144;
        const y = offset.y - canvasRect.top - 60;
        onDrop(item.type, { x: Math.max(0, x), y: Math.max(0, y) });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      id="pipeline-canvas"
      className={cn(
        "relative w-full h-full min-h-[600px] rounded-2xl border-2 transition-all duration-300 overflow-hidden",
        isOver && canDrop
          ? "border-primary border-solid bg-primary/5 scale-[1.005]"
          : "border-dashed border-border bg-card/50"
      )}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Simple empty state */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-sm p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MousePointerClick className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              Start Building! 🚀
            </h3>
            
            <p className="text-muted-foreground text-sm mb-6">
              Drag the blocks from the left sidebar and drop them here
            </p>
            
            {/* Simple flow hint */}
            <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
              <span className="px-2 py-1 rounded-lg bg-pipeline-data/15 text-pipeline-data font-medium">
                📁 Data
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-1 rounded-lg bg-pipeline-process/15 text-pipeline-process font-medium">
                🧹 Clean
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-1 rounded-lg bg-pipeline-model/15 text-pipeline-model font-medium">
                🤖 Model
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-1 rounded-lg bg-pipeline-output/15 text-pipeline-output font-medium">
                📊 Results
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <p className="text-lg font-bold">Drop here! ✨</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}