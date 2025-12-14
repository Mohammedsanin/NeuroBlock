import { useState } from "react";
import { Settings2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PreprocessingConfig {
  standardization: boolean;
  normalization: boolean;
}

interface PreprocessingNodeProps {
  config: PreprocessingConfig;
  onChange: (config: PreprocessingConfig) => void;
  columns?: string[];
}

const operations = [
  {
    key: "standardization" as const,
    label: "Standardization",
    description: "Scale features to have mean=0 and variance=1. Helps models that are sensitive to feature scales.",
  },
  {
    key: "normalization" as const,
    label: "Normalization",
    description: "Scale features to a range of 0-1. Useful when you need bounded values.",
  },
];

export function PreprocessingNode({ config, onChange, columns }: PreprocessingNodeProps) {
  const [hoveredOp, setHoveredOp] = useState<string | null>(null);

  const handleToggle = (key: keyof PreprocessingConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  return (
    <div className="space-y-3">
      {operations.map((op) => (
        <div
          key={op.key}
          className={cn(
            "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
            config[op.key]
              ? "border-pipeline-process/50 bg-pipeline-process/5"
              : "border-border bg-muted/30"
          )}
          onMouseEnter={() => setHoveredOp(op.key)}
          onMouseLeave={() => setHoveredOp(null)}
        >
          <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2">
            <Switch
              checked={config[op.key]}
              onCheckedChange={() => handleToggle(op.key)}
              className="data-[state=checked]:bg-pipeline-process"
            />
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {(config.standardization || config.normalization) && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Applied to numeric columns:</p>
          <div className="flex flex-wrap gap-1">
            {columns?.filter((c) => true).slice(0, 4).map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-full text-xs bg-pipeline-process/20 text-pipeline-process"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
