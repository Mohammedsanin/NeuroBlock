import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Upload, FileJson, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ParsedData } from "./DatasetUpload";
import { PreprocessingConfig } from "./PreprocessingNode";
import { FeatureEngineeringConfig } from "./FeatureEngineeringNode";
import { ModelType, ModelHyperparameters } from "./ModelSelection";
import { CrossValidationConfig, GridSearchConfig } from "./CrossValidation";
import { BlockType } from "./DraggableBlock";

export interface PipelineConfig {
  version: string;
  name: string;
  createdAt: string;
  nodes: Array<{
    type: BlockType;
    position: { x: number; y: number };
  }>;
  dataset: {
    fileName: string | null;
    columns: string[] | null;
    columnTypes: Record<string, string> | null;
  } | null;
  preprocessing: PreprocessingConfig;
  featureEngineering: FeatureEngineeringConfig;
  splitRatio: number;
  selectedModel: ModelType;
  hyperparameters: ModelHyperparameters;
  crossValidation: CrossValidationConfig;
  gridSearch: Omit<GridSearchConfig, "isSearching">;
}

interface PipelineSaveLoadProps {
  // Current state
  nodes: Array<{ type: BlockType; position: { x: number; y: number } }>;
  dataset: ParsedData | null;
  preprocessing: PreprocessingConfig;
  featureEngineering: FeatureEngineeringConfig;
  splitRatio: number;
  selectedModel: ModelType;
  hyperparameters: ModelHyperparameters;
  crossValidation: CrossValidationConfig;
  gridSearch: GridSearchConfig;
  // Callbacks
  onLoad: (config: PipelineConfig) => void;
}

export function PipelineSaveLoad({
  nodes,
  dataset,
  preprocessing,
  featureEngineering,
  splitRatio,
  selectedModel,
  hyperparameters,
  crossValidation,
  gridSearch,
  onLoad,
}: PipelineSaveLoadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const config: PipelineConfig = {
      version: "1.0.0",
      name: `pipeline_${new Date().toISOString().slice(0, 10)}`,
      createdAt: new Date().toISOString(),
      nodes,
      dataset: dataset
        ? {
            fileName: dataset.fileName,
            columns: dataset.columns,
            columnTypes: dataset.columnTypes,
          }
        : null,
      preprocessing,
      featureEngineering,
      splitRatio,
      selectedModel,
      hyperparameters,
      crossValidation,
      gridSearch: {
        enabled: gridSearch.enabled,
        searchComplete: gridSearch.searchComplete,
        bestParams: gridSearch.bestParams,
        bestScore: gridSearch.bestScore,
      },
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Pipeline configuration saved!", {
      description: `Saved as ${config.name}.json`,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text) as PipelineConfig;

      // Validate config
      if (!config.version || !config.nodes) {
        throw new Error("Invalid pipeline configuration");
      }

      onLoad(config);
      toast.success("Pipeline loaded successfully!", {
        description: `Loaded ${config.name || "pipeline"}`,
      });
    } catch (error) {
      toast.error("Failed to load pipeline", {
        description: "The file format is invalid or corrupted",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="flex-1"
      >
        <Upload className="w-4 h-4 mr-2" />
        Load
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        className="flex-1"
        disabled={nodes.length === 0}
      >
        <Save className="w-4 h-4 mr-2" />
        Save
      </Button>
    </div>
  );
}
