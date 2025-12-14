import { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface TrainTestSplitProps {
  ratio: number;
  onChange: (ratio: number) => void;
  totalRows?: number;
}

export function TrainTestSplit({ ratio, onChange, totalRows = 1000 }: TrainTestSplitProps) {
  const trainCount = useMemo(() => Math.round(totalRows * (ratio / 100)), [totalRows, ratio]);
  const testCount = useMemo(() => totalRows - trainCount, [totalRows, trainCount]);

  const circumference = 2 * Math.PI * 45;
  const trainDash = (ratio / 100) * circumference;
  const testDash = circumference - trainDash;

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Training</span>
          <span>Testing</span>
        </div>
        <Slider
          value={[ratio]}
          onValueChange={(v) => onChange(v[0])}
          min={50}
          max={90}
          step={5}
          className="[&_[role=slider]]:bg-pipeline-data [&_[role=slider]]:border-pipeline-data"
        />
        <div className="flex justify-between">
          <span className="text-lg font-bold text-pipeline-data">{ratio}%</span>
          <span className="text-lg font-bold text-pipeline-model">{100 - ratio}%</span>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            {/* Training segment */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--data-blue))"
              strokeWidth="10"
              strokeDasharray={`${trainDash} ${testDash}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            {/* Test segment */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--model-orange))"
              strokeWidth="10"
              strokeDasharray={`${testDash} ${trainDash}`}
              strokeDashoffset={-trainDash}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{totalRows}</span>
            <span className="text-xs text-muted-foreground">samples</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-pipeline-data/10 border border-pipeline-data/30">
          <p className="text-xs text-muted-foreground mb-1">Training samples</p>
          <p className="text-xl font-bold text-pipeline-data">{trainCount.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-pipeline-model/10 border border-pipeline-model/30">
          <p className="text-xs text-muted-foreground mb-1">Testing samples</p>
          <p className="text-xl font-bold text-pipeline-model">{testCount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
