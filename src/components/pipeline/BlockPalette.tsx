import { Database, Wand2, Scissors, Brain, BarChart3, Sparkles } from "lucide-react";
import { DraggableBlock, BlockType } from "./DraggableBlock";

interface BlockPaletteProps {
  placedBlocks: BlockType[];
}

// Each block has distinct color
const blocks: { 
  type: BlockType; 
  icon: typeof Database; 
  label: string; 
  hint: string;
  colorClass: string;
}[] = [
  { type: "dataset", icon: Database, label: "📁 Data", hint: "Your file", colorClass: "text-pipeline-data" },
  { type: "preprocess", icon: Wand2, label: "🧹 Clean", hint: "Prepare data", colorClass: "text-pipeline-clean" },
  { type: "feature", icon: Sparkles, label: "✨ Features", hint: "Optional", colorClass: "text-pipeline-feature" },
  { type: "split", icon: Scissors, label: "✂️ Split", hint: "Train & test", colorClass: "text-pipeline-split" },
  { type: "model", icon: Brain, label: "🤖 Model", hint: "Pick AI type", colorClass: "text-pipeline-model" },
  { type: "results", icon: BarChart3, label: "📊 Results", hint: "See accuracy", colorClass: "text-pipeline-output" },
];

export function BlockPalette({ placedBlocks }: BlockPaletteProps) {
  const remaining = blocks.filter(b => !placedBlocks.includes(b.type)).length;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">
          Building Blocks
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {remaining} left
        </span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Drag these to the canvas →
      </p>
      
      <div className="space-y-2">
        {blocks.map((block) => (
          <DraggableBlock
            key={block.type}
            type={block.type}
            icon={block.icon}
            label={block.label}
            hint={block.hint}
            colorClass={block.colorClass}
            isPlaced={placedBlocks.includes(block.type)}
          />
        ))}
      </div>
    </div>
  );
}