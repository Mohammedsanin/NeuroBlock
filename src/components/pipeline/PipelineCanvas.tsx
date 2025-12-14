import { useState, useCallback } from "react";
import { Database, Wand2, Split, Brain, BarChart3, Play, RotateCcw } from "lucide-react";
import { PipelineNode, NodeStatus } from "./PipelineNode";
import { Connector } from "./Connector";
import { DatasetUpload, ParsedData } from "./DatasetUpload";
import { PreprocessingNode, PreprocessingConfig } from "./PreprocessingNode";
import { TrainTestSplit } from "./TrainTestSplit";
import { ModelSelection, ModelType } from "./ModelSelection";
import { ResultsPanel } from "./ResultsPanel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PipelineCanvas() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [dataset, setDataset] = useState<ParsedData | null>(null);
  const [preprocessing, setPreprocessing] = useState<PreprocessingConfig>({
    standardization: false,
    normalization: false,
  });
  const [splitRatio, setSplitRatio] = useState(70);
  const [selectedModel, setSelectedModel] = useState<ModelType>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const getStatus = useCallback(
    (step: number): NodeStatus => {
      if (step === 0) return dataset ? "completed" : "pending";
      if (step === 1) return preprocessing.standardization || preprocessing.normalization ? "configured" : "pending";
      if (step === 2) return dataset ? "configured" : "pending";
      if (step === 3) return selectedModel ? "configured" : "pending";
      if (step === 4) return showResults ? "completed" : "pending";
      return "pending";
    },
    [dataset, preprocessing, selectedModel, showResults]
  );

  const canTrain = dataset && selectedModel;

  const handleTrain = async () => {
    if (!canTrain) {
      toast.error("Please complete all required steps");
      return;
    }

    setIsTraining(true);
    setActiveStep(4);

    // Simulate training
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsTraining(false);
    setShowResults(true);
    toast.success("Model trained successfully!");
  };

  const handleReset = () => {
    setDataset(null);
    setPreprocessing({ standardization: false, normalization: false });
    setSplitRatio(70);
    setSelectedModel(null);
    setShowResults(false);
    setActiveStep(0);
    toast.info("Pipeline reset");
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-12">
      {/* Header */}
      <header className="mb-8 md:mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              ML Pipeline Builder
            </h1>
            <p className="text-muted-foreground">
              Build machine learning pipelines visually — no code required
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleTrain}
              disabled={!canTrain || isTraining}
              className={cn(
                "gradient-output text-foreground font-medium",
                !canTrain && "opacity-50"
              )}
              size="sm"
            >
              {isTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Train Model
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
          {["Upload", "Preprocess", "Split", "Model", "Results"].map((step, i) => (
            <div key={step} className="flex items-center shrink-0">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  getStatus(i) === "completed" && "bg-accent/20 text-accent",
                  getStatus(i) === "configured" && "bg-primary/20 text-primary",
                  getStatus(i) === "pending" && "bg-muted text-muted-foreground",
                  activeStep === i && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                    getStatus(i) === "completed" && "bg-accent text-accent-foreground",
                    getStatus(i) === "configured" && "bg-primary text-primary-foreground",
                    getStatus(i) === "pending" && "bg-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                {step}
              </div>
              {i < 4 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    getStatus(i) === "completed" ? "bg-accent" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* Pipeline Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Dataset Upload */}
        <div className="space-y-4">
          <PipelineNode
            title="Dataset"
            description="Upload your training data in CSV or Excel format"
            icon={<Database className="w-5 h-5" />}
            type="data"
            status={getStatus(0)}
            isActive={activeStep === 0}
            onClick={() => setActiveStep(0)}
          >
            <DatasetUpload onUpload={setDataset} dataset={dataset} />
          </PipelineNode>
        </div>

        {/* Preprocessing */}
        <div className="space-y-4">
          <div className="hidden lg:flex justify-center">
            <Connector isActive={getStatus(0) === "completed"} />
          </div>
          <PipelineNode
            title="Preprocessing"
            description="Scale and transform your features"
            icon={<Wand2 className="w-5 h-5" />}
            type="process"
            status={getStatus(1)}
            isActive={activeStep === 1}
            onClick={() => setActiveStep(1)}
          >
            <PreprocessingNode
              config={preprocessing}
              onChange={setPreprocessing}
              columns={dataset?.columns}
            />
          </PipelineNode>
        </div>

        {/* Train-Test Split */}
        <div className="space-y-4">
          <div className="hidden lg:flex justify-center">
            <Connector isActive={getStatus(1) !== "pending"} />
          </div>
          <PipelineNode
            title="Train-Test Split"
            description="Divide your data for training and evaluation"
            icon={<Split className="w-5 h-5" />}
            type="data"
            status={getStatus(2)}
            isActive={activeStep === 2}
            onClick={() => setActiveStep(2)}
          >
            <TrainTestSplit
              ratio={splitRatio}
              onChange={setSplitRatio}
              totalRows={dataset?.rows || 1000}
            />
          </PipelineNode>
        </div>

        {/* Model Selection */}
        <div className="space-y-4">
          <div className="hidden lg:flex justify-center">
            <Connector isActive={getStatus(2) !== "pending"} />
          </div>
          <PipelineNode
            title="Model"
            description="Choose a machine learning algorithm"
            icon={<Brain className="w-5 h-5" />}
            type="model"
            status={getStatus(3)}
            isActive={activeStep === 3}
            onClick={() => setActiveStep(3)}
          >
            <ModelSelection selected={selectedModel} onChange={setSelectedModel} />
          </PipelineNode>
        </div>
      </div>

      {/* Results Panel */}
      <div className="mt-8">
        <ResultsPanel
          isVisible={showResults}
          modelType={selectedModel}
          onClose={() => setShowResults(false)}
        />
      </div>

      {/* Training Overlay */}
      {isTraining && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 text-center animate-slide-up">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-model flex items-center justify-center animate-pulse-glow">
              <Brain className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Training Model...
            </h3>
            <p className="text-muted-foreground">
              Processing {dataset?.rows || 0} samples
            </p>
            <div className="mt-4 w-48 h-2 bg-muted rounded-full overflow-hidden mx-auto">
              <div className="h-full gradient-model animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
