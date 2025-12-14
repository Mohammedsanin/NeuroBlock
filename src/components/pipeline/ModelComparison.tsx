import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, X, Trophy, BarChart3, Play, Loader2, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelType } from "./ModelSelection";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

interface ModelResult {
  id: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTime: string;
  color: string;
}

const modelConfigs: Record<string, { name: string; color: string }> = {
  logistic: { name: "Logistic Regression", color: "hsl(270, 60%, 60%)" },
  decision_tree: { name: "Decision Tree", color: "hsl(160, 60%, 45%)" },
  random_forest: { name: "Random Forest", color: "hsl(32, 95%, 55%)" },
  svm: { name: "SVM", color: "hsl(217, 91%, 60%)" },
  knn: { name: "KNN", color: "hsl(340, 65%, 55%)" },
  neural_network: { name: "Neural Network", color: "hsl(180, 60%, 45%)" },
};

interface ModelComparisonProps {
  onClose: () => void;
}

export function ModelComparison({ onClose }: ModelComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<ModelType[]>([]);
  const [trainedModels, setTrainedModels] = useState<ModelResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  const availableModels: ModelType[] = ["logistic", "decision_tree", "random_forest", "svm", "knn", "neural_network"];

  const toggleModel = (model: ModelType) => {
    if (!model) return;
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter((m) => m !== model));
    } else if (selectedModels.length < 4) {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const trainAllModels = async () => {
    if (selectedModels.length < 2) return;
    
    setIsTraining(true);
    setTrainedModels([]);

    // Simulate training each model
    const results: ModelResult[] = [];
    for (const model of selectedModels) {
      if (!model) continue;
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const baseAcc = {
        logistic: 0.85,
        decision_tree: 0.82,
        random_forest: 0.89,
        svm: 0.86,
        knn: 0.83,
        neural_network: 0.88,
      }[model] || 0.8;

      const accuracy = baseAcc + (Math.random() * 0.06 - 0.03);
      const config = modelConfigs[model];

      results.push({
        id: model,
        name: config.name,
        accuracy,
        precision: accuracy - 0.02 + Math.random() * 0.02,
        recall: accuracy + 0.01 - Math.random() * 0.02,
        f1Score: accuracy - 0.01 + Math.random() * 0.02,
        trainingTime: `${(Math.random() * 2 + 0.1).toFixed(2)}s`,
        color: config.color,
      });
      
      setTrainedModels([...results]);
    }

    setIsTraining(false);
  };

  const bestModel = useMemo(() => {
    if (trainedModels.length === 0) return null;
    return trainedModels.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
  }, [trainedModels]);

  const comparisonData = useMemo(() => {
    return trainedModels.map((m) => ({
      name: m.name.split(" ")[0],
      Accuracy: Math.round(m.accuracy * 100),
      Precision: Math.round(m.precision * 100),
      Recall: Math.round(m.recall * 100),
      F1: Math.round(m.f1Score * 100),
      fill: m.color,
    }));
  }, [trainedModels]);

  const radarData = useMemo(() => {
    const metrics = ["Accuracy", "Precision", "Recall", "F1 Score"];
    return metrics.map((metric) => {
      const entry: any = { metric };
      trainedModels.forEach((m) => {
        const key = metric.replace(" ", "");
        entry[m.name] = Math.round(
          (key === "F1Score" ? m.f1Score : m[key.toLowerCase() as keyof ModelResult] as number) * 100
        );
      });
      return entry;
    });
  }, [trainedModels]);

  const chartConfig = trainedModels.reduce((acc, m) => {
    acc[m.name] = { label: m.name, color: m.color };
    return acc;
  }, {} as any);

  return (
    <div className="glass-card p-6 animate-slide-up max-h-[85vh] overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Compare Models</h2>
            <p className="text-sm text-muted-foreground">
              Train multiple models and see which works best
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Step 1: Select Models */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
          <span className="font-medium text-foreground">Pick 2-4 models to compare</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableModels.map((model) => {
            if (!model) return null;
            const config = modelConfigs[model];
            const isSelected = selectedModels.includes(model);
            return (
              <button
                key={model}
                onClick={() => toggleModel(model)}
                disabled={!isSelected && selectedModels.length >= 4}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-muted/30",
                  !isSelected && selectedModels.length >= 4 && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{config.name}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Train */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
          <span className="font-medium text-foreground">Train & Compare</span>
        </div>
        <Button
          onClick={trainAllModels}
          disabled={selectedModels.length < 2 || isTraining}
          className="w-full gradient-output text-foreground font-medium h-12"
        >
          {isTraining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Training {trainedModels.length + 1} of {selectedModels.length}...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Train {selectedModels.length} Models
            </>
          )}
        </Button>
        {selectedModels.length < 2 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Select at least 2 models to compare
          </p>
        )}
      </div>

      {/* Results */}
      {trainedModels.length > 0 && (
        <>
          {/* Winner Banner */}
          {bestModel && !isTraining && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing Model</p>
                  <p className="text-lg font-bold text-foreground">
                    {bestModel.name} — {(bestModel.accuracy * 100).toFixed(1)}% accuracy
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <TooltipProvider>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Model</th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 cursor-help">
                          Accuracy <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[180px] text-center">
                          <p className="font-medium">How often correct?</p>
                          <p className="text-xs text-muted-foreground">% of all predictions that were right</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 cursor-help">
                          Precision <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[180px] text-center">
                          <p className="font-medium">When it says "yes"...</p>
                          <p className="text-xs text-muted-foreground">% of positive predictions that were correct</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 cursor-help">
                          Recall <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[180px] text-center">
                          <p className="font-medium">Did it find all "yes"?</p>
                          <p className="text-xs text-muted-foreground">% of actual positives found by the model</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-center gap-1 cursor-help">
                          F1 <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[180px] text-center">
                          <p className="font-medium">Balance score</p>
                          <p className="text-xs text-muted-foreground">Combines precision & recall into one number</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
              <tbody>
                {trainedModels.map((model) => (
                  <tr key={model.id} className="border-b border-border/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }} />
                        <span className="font-medium text-foreground">{model.name}</span>
                        {bestModel?.id === model.id && (
                          <Trophy className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 px-3 font-bold text-foreground">
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-3 text-muted-foreground">
                      {(model.precision * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-3 text-muted-foreground">
                      {(model.recall * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-3 text-muted-foreground">
                      {(model.f1Score * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-3 text-muted-foreground">
                      {model.trainingTime}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Bar Chart Comparison */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Accuracy Comparison</h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="Accuracy" radius={[4, 4, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <rect key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            {/* Radar Chart */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">Performance Overview</h3>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
                  {trainedModels.map((model) => (
                    <Radar
                      key={model.id}
                      name={model.name}
                      dataKey={model.name}
                      stroke={model.color}
                      fill={model.color}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </RadarChart>
              </ChartContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
