import { Lightbulb, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockType } from "./DraggableBlock";

interface PipelineSuggestionsProps {
  placedBlocks: BlockType[];
  onSuggestionClick: (type: BlockType) => void;
}

const suggestions: Record<string, { 
  missing: BlockType; 
  title: string; 
  benefit: string; 
  impact: "high" | "medium" | "low";
}[]> = {
  // When only dataset is placed
  dataset_only: [
    { missing: "model", title: "Add a Model", benefit: "Required to train your AI!", impact: "high" },
    { missing: "preprocess", title: "Add Data Cleaning", benefit: "+5-15% better accuracy", impact: "medium" },
  ],
  // When dataset + model placed
  dataset_model: [
    { missing: "split", title: "Add Train/Test Split", benefit: "Test how well your AI works", impact: "medium" },
    { missing: "preprocess", title: "Add Data Cleaning", benefit: "+5-15% better accuracy", impact: "medium" },
  ],
  // When no dataset
  no_dataset: [
    { missing: "dataset", title: "Add Your Data First", benefit: "This is where it all starts!", impact: "high" },
  ],
  // When no model
  no_model: [
    { missing: "model", title: "Pick an AI Model", benefit: "Choose how your AI learns", impact: "high" },
  ],
};

const impactColors = {
  high: "bg-destructive/10 border-destructive/30 text-destructive",
  medium: "bg-primary/10 border-primary/30 text-primary",
  low: "bg-muted border-border text-muted-foreground",
};

export function PipelineSuggestions({ placedBlocks, onSuggestionClick }: PipelineSuggestionsProps) {
  const hasDataset = placedBlocks.includes("dataset");
  const hasModel = placedBlocks.includes("model");
  const hasPreprocess = placedBlocks.includes("preprocess");
  const hasSplit = placedBlocks.includes("split");
  const hasResults = placedBlocks.includes("results");

  // Determine which suggestions to show
  let currentSuggestions: typeof suggestions.dataset_only = [];
  
  if (!hasDataset) {
    currentSuggestions = suggestions.no_dataset;
  } else if (!hasModel) {
    currentSuggestions = suggestions.no_model;
  } else if (hasDataset && hasModel) {
    currentSuggestions = suggestions.dataset_model.filter(s => !placedBlocks.includes(s.missing));
  } else if (hasDataset && !hasModel) {
    currentSuggestions = suggestions.dataset_only.filter(s => !placedBlocks.includes(s.missing));
  }

  // Filter out already placed blocks
  currentSuggestions = currentSuggestions.filter(s => !placedBlocks.includes(s.missing));

  if (currentSuggestions.length === 0) return null;

  return (
    <div className="p-4 bg-accent/5 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">Suggestions</span>
      </div>
      
      <div className="space-y-2">
        {currentSuggestions.slice(0, 2).map((suggestion) => (
          <button
            key={suggestion.missing}
            onClick={() => onSuggestionClick(suggestion.missing)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02]",
              impactColors[suggestion.impact]
            )}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{suggestion.title}</p>
              <p className="text-xs opacity-80">{suggestion.benefit}</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </button>
        ))}
      </div>
    </div>
  );
}