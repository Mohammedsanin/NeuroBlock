import { useState } from "react";
import { Settings2, Info, AlertTriangle, Hash, Type, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FeatureEngineeringConfig {
  handleMissing: boolean;
  missingStrategy: "mean" | "median" | "mode" | "drop";
  encodeCategories: boolean;
  encodingMethod: "onehot" | "label" | "target";
  createFeatures: boolean;
  featureTypes: string[];
}

interface FeatureEngineeringNodeProps {
  config: FeatureEngineeringConfig;
  onChange: (config: FeatureEngineeringConfig) => void;
  columns?: string[];
}

const operations = [
  {
    key: "handleMissing" as const,
    label: "Handle Missing Values",
    icon: AlertTriangle,
    description: "Fill or remove rows with missing data to prevent model errors.",
    color: "text-destructive",
  },
  {
    key: "encodeCategories" as const,
    label: "Encode Categories",
    icon: Type,
    description: "Convert text categories into numbers so ML models can understand them.",
    color: "text-pipeline-process",
  },
  {
    key: "createFeatures" as const,
    label: "Create New Features",
    icon: Layers,
    description: "Generate new columns from existing data to help the model learn better patterns.",
    color: "text-pipeline-data",
  },
];

const missingStrategies = [
  { value: "mean", label: "Mean", desc: "Fill with average value" },
  { value: "median", label: "Median", desc: "Fill with middle value" },
  { value: "mode", label: "Mode", desc: "Fill with most common" },
  { value: "drop", label: "Drop rows", desc: "Remove incomplete rows" },
];

const encodingMethods = [
  { value: "onehot", label: "One-Hot", desc: "Create binary columns" },
  { value: "label", label: "Label", desc: "Assign numbers to categories" },
  { value: "target", label: "Target", desc: "Use target statistics" },
];

const featureTypeOptions = [
  { value: "polynomial", label: "Polynomial Features" },
  { value: "interaction", label: "Feature Interactions" },
  { value: "binning", label: "Numerical Binning" },
  { value: "log", label: "Log Transform" },
];

export function FeatureEngineeringNode({ config, onChange, columns }: FeatureEngineeringNodeProps) {
  const handleToggle = (key: keyof FeatureEngineeringConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  const numericCols = columns?.slice(0, 3) || [];
  const categoricalCols = columns?.slice(3, 5) || [];

  return (
    <div className="space-y-4">
      {operations.map((op) => {
        const Icon = op.icon;
        const isEnabled = config[op.key] as boolean;

        return (
          <div key={op.key} className="space-y-2">
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                isEnabled
                  ? "border-pipeline-process/50 bg-pipeline-process/5"
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4", isEnabled ? op.color : "text-muted-foreground")} />
                <span className="font-medium text-foreground text-sm">{op.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">{op.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={() => handleToggle(op.key)}
                className="data-[state=checked]:bg-pipeline-process"
              />
            </div>

            {/* Expanded options */}
            {op.key === "handleMissing" && isEnabled && (
              <div className="ml-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Strategy:</p>
                <Select
                  value={config.missingStrategy}
                  onValueChange={(v) =>
                    onChange({ ...config, missingStrategy: v as typeof config.missingStrategy })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {missingStrategies.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <div>
                          <span className="font-medium">{s.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{s.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {op.key === "encodeCategories" && isEnabled && (
              <div className="ml-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Encoding method:</p>
                <Select
                  value={config.encodingMethod}
                  onValueChange={(v) =>
                    onChange({ ...config, encodingMethod: v as typeof config.encodingMethod })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div>
                          <span className="font-medium">{m.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{m.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoricalCols.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {categoricalCols.map((col) => (
                      <span
                        key={col}
                        className="px-2 py-0.5 rounded-full text-xs bg-pipeline-process/20 text-pipeline-process"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {op.key === "createFeatures" && isEnabled && (
              <div className="ml-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Feature types:</p>
                <div className="grid grid-cols-2 gap-2">
                  {featureTypeOptions.map((ft) => (
                    <button
                      key={ft.value}
                      onClick={() => {
                        const types = config.featureTypes.includes(ft.value)
                          ? config.featureTypes.filter((t) => t !== ft.value)
                          : [...config.featureTypes, ft.value];
                        onChange({ ...config, featureTypes: types });
                      }}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                        config.featureTypes.includes(ft.value)
                          ? "bg-pipeline-data/20 text-pipeline-data border border-pipeline-data/30"
                          : "bg-muted/50 text-muted-foreground border border-transparent hover:border-border"
                      )}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {(config.handleMissing || config.encodeCategories || config.createFeatures) && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {[
              config.handleMissing && `Missing values: ${config.missingStrategy}`,
              config.encodeCategories && `Encoding: ${config.encodingMethod}`,
              config.createFeatures && `${config.featureTypes.length} feature types`,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      )}
    </div>
  );
}
