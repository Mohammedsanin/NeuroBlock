import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  GitBranch,
  TreeDeciduous,
  Target,
  Network,
  Cpu,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CrossValidation, CrossValidationConfig, GridSearchConfig } from "./CrossValidation";

export type ModelType =
  | "logistic"
  | "decision_tree"
  | "random_forest"
  | "svm"
  | "knn"
  | "neural_network"
  | null;

export interface ModelHyperparameters {
  // Logistic Regression
  logistic_C?: number;
  logistic_penalty?: "l1" | "l2" | "none";
  // Decision Tree
  tree_max_depth?: number;
  tree_min_samples?: number;
  // Random Forest
  rf_n_estimators?: number;
  rf_max_depth?: number;
  // SVM
  svm_C?: number;
  svm_kernel?: "linear" | "rbf" | "poly";
  // KNN
  knn_n_neighbors?: number;
  knn_weights?: "uniform" | "distance";
  // Neural Network
  nn_hidden_layers?: number;
  nn_neurons?: number;
  nn_activation?: "relu" | "tanh" | "sigmoid";
  nn_learning_rate?: number;
}

interface ModelSelectionProps {
  selected: ModelType;
  onChange: (model: ModelType) => void;
  hyperparameters?: ModelHyperparameters;
  onHyperparametersChange?: (params: ModelHyperparameters) => void;
  crossValidation?: CrossValidationConfig;
  onCrossValidationChange?: (config: CrossValidationConfig) => void;
  gridSearch?: GridSearchConfig;
  onGridSearchChange?: (config: GridSearchConfig) => void;
}

const models = [
  {
    id: "logistic" as const,
    name: "Logistic Regression",
    description: "Binary classification with linear boundaries",
    icon: TrendingUp,
    color: "pipeline-model",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        <path
          d="M 5 35 Q 20 35, 30 30 Q 40 25, 45 20 Q 50 10, 60 5 Q 70 2, 75 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-pipeline-model"
        />
        <line x1="0" y1="20" x2="80" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" className="text-muted-foreground" />
      </svg>
    ),
  },
  {
    id: "decision_tree" as const,
    name: "Decision Tree",
    description: "Interpretable decision rules",
    icon: GitBranch,
    color: "pipeline-process",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        <circle cx="40" cy="5" r="4" fill="currentColor" className="text-pipeline-model" />
        <line x1="40" y1="9" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-pipeline-model" />
        <line x1="40" y1="9" x2="60" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-pipeline-model" />
        <circle cx="20" cy="22" r="3" fill="currentColor" className="text-pipeline-process" />
        <circle cx="60" cy="22" r="3" fill="currentColor" className="text-pipeline-process" />
        <circle cx="10" cy="37" r="2" fill="currentColor" className="text-accent" />
        <circle cx="30" cy="37" r="2" fill="currentColor" className="text-accent" />
      </svg>
    ),
  },
  {
    id: "random_forest" as const,
    name: "Random Forest",
    description: "Ensemble of decision trees",
    icon: TreeDeciduous,
    color: "accent",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        {[15, 40, 65].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="8" r="3" fill="currentColor" className="text-accent" />
            <line x1={x} y1="11" x2={x - 8} y2="22" stroke="currentColor" strokeWidth="1" className="text-accent/70" />
            <line x1={x} y1="11" x2={x + 8} y2="22" stroke="currentColor" strokeWidth="1" className="text-accent/70" />
            <circle cx={x - 8} cy="24" r="2" fill="currentColor" className="text-accent/50" />
            <circle cx={x + 8} cy="24" r="2" fill="currentColor" className="text-accent/50" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "svm" as const,
    name: "Support Vector Machine",
    description: "Maximum margin classifier",
    icon: Target,
    color: "pipeline-data",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        <line x1="10" y1="35" x2="70" y2="5" stroke="currentColor" strokeWidth="2" className="text-pipeline-data" />
        <line x1="5" y1="30" x2="65" y2="0" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3" className="text-pipeline-data/50" />
        <line x1="15" y1="40" x2="75" y2="10" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3" className="text-pipeline-data/50" />
        <circle cx="20" cy="30" r="3" fill="currentColor" className="text-pipeline-model" />
        <circle cx="60" cy="10" r="3" fill="currentColor" className="text-accent" />
      </svg>
    ),
  },
  {
    id: "knn" as const,
    name: "K-Nearest Neighbors",
    description: "Classification by proximity",
    icon: Network,
    color: "secondary",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        <circle cx="40" cy="20" r="5" fill="currentColor" className="text-secondary" />
        {[
          [25, 12], [55, 15], [30, 32], [50, 28], [15, 25], [65, 22],
        ].map(([x, y], i) => (
          <g key={i}>
            <line x1="40" y1="20" x2={x} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2" className="text-secondary/50" />
            <circle cx={x} cy={y} r="2.5" fill="currentColor" className={i < 3 ? "text-pipeline-model" : "text-accent"} />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "neural_network" as const,
    name: "Neural Network",
    description: "Deep learning for complex patterns",
    icon: Cpu,
    color: "destructive",
    visual: (
      <svg viewBox="0 0 80 40" className="w-full h-8">
        {/* Input layer */}
        {[10, 20, 30].map((y, i) => (
          <circle key={`in-${i}`} cx="10" cy={y} r="3" fill="currentColor" className="text-pipeline-data" />
        ))}
        {/* Hidden layer */}
        {[8, 16, 24, 32].map((y, i) => (
          <circle key={`h-${i}`} cx="40" cy={y} r="3" fill="currentColor" className="text-pipeline-process" />
        ))}
        {/* Output */}
        <circle cx="70" cy="20" r="4" fill="currentColor" className="text-accent" />
        {/* Connections */}
        {[10, 20, 30].map((y1) =>
          [8, 16, 24, 32].map((y2, i) => (
            <line key={`c1-${y1}-${i}`} x1="13" y1={y1} x2="37" y2={y2} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
          ))
        )}
        {[8, 16, 24, 32].map((y, i) => (
          <line key={`c2-${i}`} x1="43" y1={y} x2="66" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/30" />
        ))}
      </svg>
    ),
  },
];

export function ModelSelection({
  selected,
  onChange,
  hyperparameters = {},
  onHyperparametersChange,
  crossValidation = { enabled: false, folds: 5, stratified: true, shuffleData: true },
  onCrossValidationChange,
  gridSearch = { enabled: false, isSearching: false, searchComplete: false, bestParams: null, bestScore: null },
  onGridSearchChange,
}: ModelSelectionProps) {
  const [expandedModel, setExpandedModel] = useState<ModelType>(null);

  const handleApplyBestParams = () => {
    if (gridSearch.bestParams) {
      onHyperparametersChange?.({ ...hyperparameters, ...gridSearch.bestParams });
    }
  };

  const updateParam = (key: keyof ModelHyperparameters, value: any) => {
    onHyperparametersChange?.({ ...hyperparameters, [key]: value });
  };

  const renderHyperparameters = (modelId: ModelType) => {
    if (!modelId || expandedModel !== modelId) return null;

    switch (modelId) {
      case "logistic":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Regularization (C)</span>
                <span>{hyperparameters.logistic_C ?? 1.0}</span>
              </div>
              <Slider
                value={[hyperparameters.logistic_C ?? 1.0]}
                onValueChange={(v) => updateParam("logistic_C", v[0])}
                min={0.01}
                max={10}
                step={0.1}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Penalty</p>
              <Select
                value={hyperparameters.logistic_penalty ?? "l2"}
                onValueChange={(v) => updateParam("logistic_penalty", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="l1">L1 (Lasso)</SelectItem>
                  <SelectItem value="l2">L2 (Ridge)</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "decision_tree":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Max Depth</span>
                <span>{hyperparameters.tree_max_depth ?? 5}</span>
              </div>
              <Slider
                value={[hyperparameters.tree_max_depth ?? 5]}
                onValueChange={(v) => updateParam("tree_max_depth", v[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Min Samples Split</span>
                <span>{hyperparameters.tree_min_samples ?? 2}</span>
              </div>
              <Slider
                value={[hyperparameters.tree_min_samples ?? 2]}
                onValueChange={(v) => updateParam("tree_min_samples", v[0])}
                min={2}
                max={20}
                step={1}
              />
            </div>
          </div>
        );

      case "random_forest":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Number of Trees</span>
                <span>{hyperparameters.rf_n_estimators ?? 100}</span>
              </div>
              <Slider
                value={[hyperparameters.rf_n_estimators ?? 100]}
                onValueChange={(v) => updateParam("rf_n_estimators", v[0])}
                min={10}
                max={500}
                step={10}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Max Depth</span>
                <span>{hyperparameters.rf_max_depth ?? 10}</span>
              </div>
              <Slider
                value={[hyperparameters.rf_max_depth ?? 10]}
                onValueChange={(v) => updateParam("rf_max_depth", v[0])}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </div>
        );

      case "svm":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Regularization (C)</span>
                <span>{hyperparameters.svm_C ?? 1.0}</span>
              </div>
              <Slider
                value={[hyperparameters.svm_C ?? 1.0]}
                onValueChange={(v) => updateParam("svm_C", v[0])}
                min={0.01}
                max={10}
                step={0.1}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Kernel</p>
              <Select
                value={hyperparameters.svm_kernel ?? "rbf"}
                onValueChange={(v) => updateParam("svm_kernel", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="rbf">RBF (Gaussian)</SelectItem>
                  <SelectItem value="poly">Polynomial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "knn":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Number of Neighbors (K)</span>
                <span>{hyperparameters.knn_n_neighbors ?? 5}</span>
              </div>
              <Slider
                value={[hyperparameters.knn_n_neighbors ?? 5]}
                onValueChange={(v) => updateParam("knn_n_neighbors", v[0])}
                min={1}
                max={20}
                step={1}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Weights</p>
              <Select
                value={hyperparameters.knn_weights ?? "uniform"}
                onValueChange={(v) => updateParam("knn_weights", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uniform">Uniform</SelectItem>
                  <SelectItem value="distance">Distance-weighted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "neural_network":
        return (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Hidden Layers</span>
                <span>{hyperparameters.nn_hidden_layers ?? 2}</span>
              </div>
              <Slider
                value={[hyperparameters.nn_hidden_layers ?? 2]}
                onValueChange={(v) => updateParam("nn_hidden_layers", v[0])}
                min={1}
                max={5}
                step={1}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Neurons per Layer</span>
                <span>{hyperparameters.nn_neurons ?? 64}</span>
              </div>
              <Slider
                value={[hyperparameters.nn_neurons ?? 64]}
                onValueChange={(v) => updateParam("nn_neurons", v[0])}
                min={8}
                max={256}
                step={8}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Activation</p>
              <Select
                value={hyperparameters.nn_activation ?? "relu"}
                onValueChange={(v) => updateParam("nn_activation", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relu">ReLU</SelectItem>
                  <SelectItem value="tanh">Tanh</SelectItem>
                  <SelectItem value="sigmoid">Sigmoid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Learning Rate</span>
                <span>{hyperparameters.nn_learning_rate ?? 0.001}</span>
              </div>
              <Slider
                value={[hyperparameters.nn_learning_rate ?? 0.001]}
                onValueChange={(v) => updateParam("nn_learning_rate", v[0])}
                min={0.0001}
                max={0.1}
                step={0.0001}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {models.map((model) => {
        const isSelected = selected === model.id;
        const isExpanded = expandedModel === model.id;
        const Icon = model.icon;

        return (
          <div
            key={model.id}
            className={cn(
              "relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
              isSelected
                ? `border-${model.color} bg-${model.color}/10`
                : "border-border hover:border-muted-foreground/50 bg-muted/30"
            )}
          >
            <button
              onClick={() => {
                onChange(model.id);
                setExpandedModel(isSelected ? (isExpanded ? null : model.id) : model.id);
              }}
              className="w-full p-4 text-left"
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full gradient-model flex items-center justify-center animate-scale-bounce">
                  <Check className="w-3 h-3 text-foreground" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    isSelected ? "gradient-model" : "bg-muted"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isSelected ? "text-foreground" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 pr-6">
                  <h4 className="font-display font-semibold text-foreground">{model.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                </div>
              </div>

              <div className="mt-3 p-2 rounded-lg bg-background/50">{model.visual}</div>

              {isSelected && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Hide parameters
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Tune parameters
                    </>
                  )}
                </div>
              )}
            </button>

            {isSelected && isExpanded && (
              <div className="px-4 pb-4">{renderHyperparameters(model.id)}</div>
            )}
          </div>
        );
      })}

      {/* Cross-Validation & Grid Search Section */}
      {selected && onCrossValidationChange && onGridSearchChange && (
        <div className="mt-6 pt-6 border-t border-border">
          <CrossValidation
            cvConfig={crossValidation}
            onCVChange={onCrossValidationChange}
            gridSearchConfig={gridSearch}
            onGridSearchChange={onGridSearchChange}
            selectedModel={selected}
            onApplyBestParams={handleApplyBestParams}
          />
        </div>
      )}
    </div>
  );
}
