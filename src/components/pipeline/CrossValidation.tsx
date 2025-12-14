import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shuffle,
  Grid3X3,
  Zap,
  Play,
  Check,
  Loader2,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModelHyperparameters, ModelType } from "./ModelSelection";

export interface CrossValidationConfig {
  enabled: boolean;
  folds: number;
  stratified: boolean;
  shuffleData: boolean;
}

export interface GridSearchConfig {
  enabled: boolean;
  isSearching: boolean;
  searchComplete: boolean;
  bestParams: ModelHyperparameters | null;
  bestScore: number | null;
}

interface CrossValidationProps {
  cvConfig: CrossValidationConfig;
  onCVChange: (config: CrossValidationConfig) => void;
  gridSearchConfig: GridSearchConfig;
  onGridSearchChange: (config: GridSearchConfig) => void;
  selectedModel: ModelType;
  onApplyBestParams: () => void;
}

const getParamRanges = (model: ModelType) => {
  switch (model) {
    case "logistic":
      return { param: "C", range: "0.01 - 10", steps: 10 };
    case "decision_tree":
      return { param: "max_depth", range: "1 - 20", steps: 10 };
    case "random_forest":
      return { param: "n_estimators, max_depth", range: "10-500, 1-30", steps: 25 };
    case "svm":
      return { param: "C, kernel", range: "0.01-10, linear/rbf/poly", steps: 15 };
    case "knn":
      return { param: "n_neighbors, weights", range: "1-20, uniform/distance", steps: 20 };
    case "neural_network":
      return { param: "layers, neurons, lr", range: "1-5, 8-256, 0.0001-0.1", steps: 30 };
    default:
      return { param: "params", range: "varies", steps: 10 };
  }
};

export function CrossValidation({
  cvConfig,
  onCVChange,
  gridSearchConfig,
  onGridSearchChange,
  selectedModel,
  onApplyBestParams,
}: CrossValidationProps) {
  const updateCV = (key: keyof CrossValidationConfig, value: any) => {
    onCVChange({ ...cvConfig, [key]: value });
  };

  const paramRanges = selectedModel ? getParamRanges(selectedModel) : null;

  const handleGridSearch = async () => {
    onGridSearchChange({ ...gridSearchConfig, isSearching: true, searchComplete: false });
    
    // Simulate grid search
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate "best" params based on model
    let bestParams: ModelHyperparameters = {};
    switch (selectedModel) {
      case "logistic":
        bestParams = { logistic_C: 1.5, logistic_penalty: "l2" };
        break;
      case "decision_tree":
        bestParams = { tree_max_depth: 8, tree_min_samples: 5 };
        break;
      case "random_forest":
        bestParams = { rf_n_estimators: 150, rf_max_depth: 12 };
        break;
      case "svm":
        bestParams = { svm_C: 2.0, svm_kernel: "rbf" };
        break;
      case "knn":
        bestParams = { knn_n_neighbors: 7, knn_weights: "distance" };
        break;
      case "neural_network":
        bestParams = { nn_hidden_layers: 3, nn_neurons: 128, nn_activation: "relu", nn_learning_rate: 0.001 };
        break;
    }

    onGridSearchChange({
      ...gridSearchConfig,
      isSearching: false,
      searchComplete: true,
      bestParams,
      bestScore: 0.85 + Math.random() * 0.1,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cross-Validation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-pipeline-data" />
            <span className="font-medium text-foreground">Cross-Validation</span>
          </div>
          <Switch
            checked={cvConfig.enabled}
            onCheckedChange={(v) => updateCV("enabled", v)}
          />
        </div>

        {cvConfig.enabled && (
          <div className="pl-6 space-y-4 animate-fade-in">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  Number of Folds
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-xs">
                          Data is split into K folds. Model trains on K-1 folds and validates on 1, rotating through all combinations.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="font-mono">{cvConfig.folds}</span>
              </div>
              <Slider
                value={[cvConfig.folds]}
                onValueChange={(v) => updateCV("folds", v[0])}
                min={2}
                max={10}
                step={1}
              />
            </div>

            {/* Visual representation of folds */}
            <div className="flex gap-1">
              {Array.from({ length: cvConfig.folds }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-6 rounded transition-all duration-300",
                    i === 0 ? "bg-pipeline-model/50" : "bg-pipeline-data/30"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              <span className="inline-block w-3 h-3 rounded bg-pipeline-model/50 mr-1 align-middle" />
              Validation Fold
              <span className="inline-block w-3 h-3 rounded bg-pipeline-data/30 ml-3 mr-1 align-middle" />
              Training Folds
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Stratified</span>
                </div>
                <Switch
                  checked={cvConfig.stratified}
                  onCheckedChange={(v) => updateCV("stratified", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Shuffle</span>
                </div>
                <Switch
                  checked={cvConfig.shuffleData}
                  onCheckedChange={(v) => updateCV("shuffleData", v)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Search Section */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-pipeline-model" />
            <span className="font-medium text-foreground">Grid Search</span>
          </div>
          <Switch
            checked={gridSearchConfig.enabled}
            onCheckedChange={(v) => onGridSearchChange({ ...gridSearchConfig, enabled: v })}
            disabled={!selectedModel}
          />
        </div>

        {!selectedModel && (
          <p className="text-xs text-muted-foreground">Select a model to enable grid search</p>
        )}

        {gridSearchConfig.enabled && selectedModel && (
          <div className="pl-6 space-y-4 animate-fade-in">
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <p className="text-sm font-medium text-foreground">Search Parameters</p>
              {paramRanges && (
                <>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground">{paramRanges.param}:</span> {paramRanges.range}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ~{paramRanges.steps} combinations to try
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={handleGridSearch}
              disabled={gridSearchConfig.isSearching}
              className="w-full gradient-model text-foreground"
            >
              {gridSearchConfig.isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Grid Search
                </>
              )}
            </Button>

            {gridSearchConfig.searchComplete && gridSearchConfig.bestParams && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-3 animate-scale-bounce">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">Best Parameters Found!</span>
                </div>
                <div className="text-sm space-y-1">
                  {Object.entries(gridSearchConfig.bestParams).map(([key, value]) => (
                    <p key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key.replace(/_/g, " ")}:</span>
                      <span className="font-mono text-foreground">{String(value)}</span>
                    </p>
                  ))}
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Best CV Score: </span>
                  <span className="font-mono text-accent font-bold">
                    {(gridSearchConfig.bestScore! * 100).toFixed(1)}%
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onApplyBestParams}
                  className="w-full"
                >
                  Apply Best Parameters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
