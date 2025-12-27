import { useState, useCallback, useMemo, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Database,
  Wand2,
  Scissors,
  Brain,
  BarChart3,
  Play,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { BlockPalette } from "./BlockPalette";
import { StepsSidebar } from "./StepsSidebar";
import { DropCanvas } from "./DropCanvas";
import { CanvasNode, NodeStatus } from "./CanvasNode";
import { FlowConnector } from "./FlowConnector";
import { ConfigDrawer } from "./ConfigDrawer";
import { DatasetUpload, ParsedData } from "./DatasetUpload";
import { PreprocessingNode, PreprocessingConfig } from "./PreprocessingNode";
import { FeatureEngineeringNode, FeatureEngineeringConfig } from "./FeatureEngineeringNode";
import { TrainTestSplit } from "./TrainTestSplit";
import { ModelSelection, ModelType, ModelHyperparameters } from "./ModelSelection";
import { ResultsPanel } from "./ResultsPanel";
import { BlockType } from "./DraggableBlock";
import { CrossValidationConfig, GridSearchConfig } from "./CrossValidation";
import { PipelineSaveLoad, PipelineConfig } from "./PipelineSaveLoad";
import { TutorialWalkthrough } from "./TutorialWalkthrough";
import { PipelineSuggestions } from "./PipelineSuggestions";
import neuroBlocksLogo from "@/assets/neuroblocks-logo.png";
import { trainModel, TrainingResponse, checkHealth } from "@/lib/api";

interface PlacedNode {
  type: BlockType;
  position: { x: number; y: number };
}

// Each block has distinct, vibrant color
const nodeConfigs: Record<BlockType, {
  title: string;
  description: string;
  helpText: string;
  color: string;
  glowColor: string;
  borderColor: string;
  nodeClass: string;
}> = {
  dataset: {
    title: "📁 Data",
    description: "Upload your file",
    helpText: "Upload your training data in CSV format.",
    color: "bg-pipeline-data/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--data-blue)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-data",
    nodeClass: "node-data",
  },
  preprocess: {
    title: "🧹 Clean",
    description: "Prepare data",
    helpText: "Scale and normalize your data for better results.",
    color: "bg-pipeline-clean/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--clean-purple)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-clean",
    nodeClass: "node-clean",
  },
  feature: {
    title: "✨ Features",
    description: "Optional extras",
    helpText: "Handle missing values and create new features.",
    color: "bg-pipeline-feature/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--feature-pink)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-feature",
    nodeClass: "node-feature",
  },
  split: {
    title: "✂️ Split",
    description: "Train & test",
    helpText: "Split data into training and testing sets.",
    color: "bg-pipeline-split/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--split-cyan)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-split",
    nodeClass: "node-split",
  },
  model: {
    title: "🤖 Model",
    description: "Pick AI type",
    helpText: "Choose which algorithm will learn from your data.",
    color: "bg-pipeline-model/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--model-orange)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-model",
    nodeClass: "node-model",
  },
  results: {
    title: "📊 Results",
    description: "See accuracy",
    helpText: "View how well your model performs.",
    color: "bg-pipeline-output/15",
    glowColor: "shadow-[0_0_20px_-5px_hsl(var(--output-green)/0.4)]",
    borderColor: "border-t-4 border-t-pipeline-output",
    nodeClass: "node-output",
  },
};

const iconMap: Record<BlockType, typeof Database> = {
  dataset: Database,
  preprocess: Wand2,
  feature: Sparkles,
  split: Scissors,
  model: Brain,
  results: BarChart3,
};

const defaultPositions: Record<BlockType, { x: number; y: number }> = {
  dataset: { x: 40, y: 40 },
  preprocess: { x: 380, y: 40 },
  feature: { x: 720, y: 40 },
  split: { x: 40, y: 300 },
  model: { x: 380, y: 300 },
  results: { x: 720, y: 300 },
};

export function PipelineBuilder() {
  const [placedNodes, setPlacedNodes] = useState<PlacedNode[]>([]);
  const [activeNode, setActiveNode] = useState<BlockType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<BlockType | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial for first-time users
    const hasSeenTutorial = localStorage.getItem("ml-builder-tutorial-seen");
    return !hasSeenTutorial;
  });

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem("ml-builder-tutorial-seen", "true");
  };

  // Pipeline state
  const [dataset, setDataset] = useState<ParsedData | null>(null);
  const [preprocessing, setPreprocessing] = useState<PreprocessingConfig>({
    standardization: false,
    normalization: false,
  });
  const [featureEngineering, setFeatureEngineering] = useState<FeatureEngineeringConfig>({
    handleMissing: false,
    missingStrategy: "mean",
    encodeCategories: false,
    encodingMethod: "onehot",
    createFeatures: false,
    featureTypes: [],
  });
  const [splitRatio, setSplitRatio] = useState(70);
  const [selectedModel, setSelectedModel] = useState<ModelType>(null);
  const [hyperparameters, setHyperparameters] = useState<ModelHyperparameters>({});
  const [crossValidation, setCrossValidation] = useState<CrossValidationConfig>({
    enabled: false,
    folds: 5,
    stratified: true,
    shuffleData: true,
  });
  const [gridSearch, setGridSearch] = useState<GridSearchConfig>({
    enabled: false,
    isSearching: false,
    searchComplete: false,
    bestParams: null,
    bestScore: null,
  });
  const [isTraining, setIsTraining] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [trainingResults, setTrainingResults] = useState<TrainingResponse | null>(null);

  const placedBlockTypes = useMemo(() => placedNodes.map((n) => n.type), [placedNodes]);

  const getStatus = useCallback(
    (type: BlockType): NodeStatus => {
      switch (type) {
        case "dataset":
          return dataset ? "completed" : "pending";
        case "preprocess":
          return preprocessing.standardization || preprocessing.normalization
            ? "configured"
            : "pending";
        case "feature":
          return featureEngineering.handleMissing || featureEngineering.encodeCategories || featureEngineering.createFeatures
            ? "configured"
            : "pending";
        case "split":
          return dataset ? "configured" : "pending";
        case "model":
          return selectedModel ? "configured" : "pending";
        case "results":
          return showResults ? "completed" : "pending";
        default:
          return "pending";
      }
    },
    [dataset, preprocessing, featureEngineering, selectedModel, showResults]
  );

  const steps = useMemo(
    () => [
      { id: 0, label: "Upload Dataset", icon: Database, status: getStatus("dataset") },
      { id: 1, label: "Preprocessing", icon: Wand2, status: getStatus("preprocess") },
      { id: 2, label: "Feature Engineering", icon: Sparkles, status: getStatus("feature") },
      { id: 3, label: "Train-Test Split", icon: Scissors, status: getStatus("split") },
      { id: 4, label: "Model Selection", icon: Brain, status: getStatus("model") },
      { id: 5, label: "View Results", icon: BarChart3, status: getStatus("results") },
    ],
    [getStatus]
  );

  const handleDrop = useCallback(
    (type: BlockType, position: { x: number; y: number }) => {
      if (placedBlockTypes.includes(type)) {
        toast.error(`${nodeConfigs[type].title} is already on the canvas`);
        return;
      }
      setPlacedNodes((prev) => [...prev, { type, position }]);
      toast.success(`${nodeConfigs[type].title} added to pipeline`);
    },
    [placedBlockTypes]
  );

  const handleNodeClick = useCallback((type: BlockType) => {
    setActiveNode(type);
    setActiveDrawer(type);
    setDrawerOpen(true);
  }, []);

  const handleRemoveNode = useCallback((type: BlockType) => {
    setPlacedNodes((prev) => prev.filter((n) => n.type !== type));
    toast.info(`${nodeConfigs[type].title} removed`);
  }, []);

  const handlePositionChange = useCallback((type: BlockType, position: { x: number; y: number }) => {
    setPlacedNodes((prev) =>
      prev.map((node) => (node.type === type ? { ...node, position } : node))
    );
  }, []);

  const handleAutoArrange = useCallback(() => {
    setPlacedNodes((prev) =>
      prev.map((node) => ({
        ...node,
        position: defaultPositions[node.type],
      }))
    );
    toast.success("Pipeline auto-arranged!");
  }, []);

  const handleStepClick = useCallback(
    (stepId: number) => {
      const typeMap: BlockType[] = ["dataset", "preprocess", "feature", "split", "model", "results"];
      const type = typeMap[stepId];
      if (placedBlockTypes.includes(type)) {
        handleNodeClick(type);
      } else {
        toast.info(`Drag the ${nodeConfigs[type].title} block to the canvas first`);
      }
    },
    [placedBlockTypes, handleNodeClick]
  );

  const handleReset = useCallback(() => {
    setPlacedNodes([]);
    setDataset(null);
    setPreprocessing({ standardization: false, normalization: false });
    setFeatureEngineering({
      handleMissing: false,
      missingStrategy: "mean",
      encodeCategories: false,
      encodingMethod: "onehot",
      createFeatures: false,
      featureTypes: [],
    });
    setSplitRatio(70);
    setSelectedModel(null);
    setHyperparameters({});
    setShowResults(false);
    setActiveNode(null);
    toast.info("Pipeline reset");
  }, []);

  // Only require dataset + model + feature selection - other blocks are optional
  const canTrain = dataset && selectedModel && dataset.inputFeatures && dataset.targetVariable;
  const hasOptionalBlocks = placedBlockTypes.includes("preprocess") || placedBlockTypes.includes("split");

  const handleTrain = async () => {
    if (!dataset) {
      toast.error("Add your data first! 📁");
      return;
    }
    if (!dataset.inputFeatures || !dataset.targetVariable) {
      toast.error("Select input features and target variable first! ⚙️");
      return;
    }
    if (!selectedModel) {
      toast.error("Pick a model first! 🤖");
      return;
    }
    if (!dataset.sessionId) {
      toast.error("Session expired. Please re-upload your dataset.");
      return;
    }

    // Check backend health first
    const isHealthy = await checkHealth();
    if (!isHealthy) {
      toast.error("Backend server is not running! Please start it first.");
      return;
    }

    setIsTraining(true);

    try {
      // Prepare training request
      const trainingRequest = {
        session_id: dataset.sessionId,
        input_features: dataset.inputFeatures,
        target_variable: dataset.targetVariable,
        preprocessing: {
          standardization: preprocessing.standardization,
          normalization: preprocessing.normalization,
          handle_missing: featureEngineering.handleMissing,
          missing_strategy: featureEngineering.missingStrategy,
          encode_categories: featureEngineering.encodeCategories,
        },
        split_ratio: splitRatio,
        model_type: selectedModel,
        hyperparameters,
      };

      // Call backend API
      const results = await trainModel(trainingRequest);

      // Store results
      setTrainingResults(results);
      setShowResults(true);

      if (hasOptionalBlocks) {
        toast.success(`Model trained! Accuracy: ${(results.test_metrics.accuracy * 100).toFixed(1)}% 🎉`);
      } else {
        toast.success(`Model trained! Accuracy: ${(results.test_metrics.accuracy * 100).toFixed(1)}% 💡`);
      }
    } catch (error: any) {
      toast.error(error.message || "Training failed. Check backend server.");
      console.error("Training error:", error);
    } finally {
      setIsTraining(false);
    }
  };

  const renderDrawerContent = () => {
    switch (activeDrawer) {
      case "dataset":
        return (
          <DatasetUpload
            onUpload={setDataset}
            dataset={dataset}
            onFeatureTargetSelect={(features, target) => {
              console.log("Features selected:", features, "Target:", target);
            }}
          />
        );
      case "preprocess":
        return (
          <PreprocessingNode
            config={preprocessing}
            onChange={setPreprocessing}
            columns={dataset?.columns}
          />
        );
      case "feature":
        return (
          <FeatureEngineeringNode
            config={featureEngineering}
            onChange={setFeatureEngineering}
            columns={dataset?.columns}
          />
        );
      case "split":
        return (
          <TrainTestSplit
            ratio={splitRatio}
            onChange={setSplitRatio}
            totalRows={dataset?.rows || 1000}
          />
        );
      case "model":
        return (
          <ModelSelection
            selected={selectedModel}
            onChange={setSelectedModel}
            hyperparameters={hyperparameters}
            onHyperparametersChange={setHyperparameters}
            crossValidation={crossValidation}
            onCrossValidationChange={setCrossValidation}
            gridSearch={gridSearch}
            onGridSearchChange={setGridSearch}
          />
        );
      case "results":
        return showResults ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-center">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="font-medium text-foreground">Training Complete!</p>
              <p className="text-sm text-muted-foreground">View full results on canvas</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Complete the pipeline and click Train to see results</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Find connections between nodes
  const connections = useMemo(() => {
    const order: BlockType[] = ["dataset", "preprocess", "feature", "split", "model", "results"];
    const result: Array<{
      from: PlacedNode;
      to: PlacedNode;
      isActive: boolean;
      isCompleted: boolean;
    }> = [];

    for (let i = 0; i < order.length - 1; i++) {
      const fromNode = placedNodes.find((n) => n.type === order[i]);
      const toNode = placedNodes.find((n) => n.type === order[i + 1]);
      if (fromNode && toNode) {
        result.push({
          from: fromNode,
          to: toNode,
          isActive: getStatus(order[i]) !== "pending",
          isCompleted: getStatus(order[i]) === "completed",
        });
      }
    }
    return result;
  }, [placedNodes, getStatus]);

  const activeStepIndex = useMemo(() => {
    const types: BlockType[] = ["dataset", "preprocess", "feature", "split", "model", "results"];
    return types.findIndex((t) => t === activeNode) ?? 0;
  }, [activeNode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar - Simplified */}
        <aside className="w-72 border-r border-border bg-card flex flex-col shadow-sm">
          {/* Logo - Custom NeuroBlocks */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={neuroBlocksLogo}
                alt="NeuroBlocks Logo"
                className="w-11 h-11 rounded-xl shadow-md"
              />
              <div>
                <h1 className="font-display font-bold text-foreground text-lg">NeuroBlocks</h1>
                <p className="text-xs text-muted-foreground">Drag. Drop. Learn.</p>
              </div>
            </div>
          </div>

          {/* Steps - Clear guide */}
          <div className="flex-1 p-4 overflow-y-auto space-y-6">
            <StepsSidebar
              steps={steps}
              activeStep={activeStepIndex}
              onStepClick={handleStepClick}
            />

            <div className="border-t border-border pt-5">
              <BlockPalette placedBlocks={placedBlockTypes} />
            </div>

            {/* Smart Suggestions */}
            <PipelineSuggestions
              placedBlocks={placedBlockTypes}
              onSuggestionClick={(type) => {
                toast.info(`Drag the ${nodeConfigs[type].title} block to the canvas!`);
              }}
            />
          </div>

          {/* Actions - Simple */}
          <div className="border-t border-border">
            {/* Tutorial button */}
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full flex items-center justify-center gap-2 p-3 text-sm text-primary hover:bg-primary/5 transition-colors border-b border-border"
            >
              <HelpCircle className="w-4 h-4" />
              Show Tutorial
            </button>

            <div className="p-4 space-y-2">
              <PipelineSaveLoad
                nodes={placedNodes}
                dataset={dataset}
                preprocessing={preprocessing}
                featureEngineering={featureEngineering}
                splitRatio={splitRatio}
                selectedModel={selectedModel}
                hyperparameters={hyperparameters}
                crossValidation={crossValidation}
                gridSearch={gridSearch}
                onLoad={(config) => {
                  setPlacedNodes(config.nodes);
                  setPreprocessing(config.preprocessing);
                  setFeatureEngineering(config.featureEngineering);
                  setSplitRatio(config.splitRatio);
                  setSelectedModel(config.selectedModel);
                  setHyperparameters(config.hyperparameters);
                  setCrossValidation(config.crossValidation);
                  setGridSearch({ ...config.gridSearch, isSearching: false });
                }}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoArrange}
                  className="flex-1 rounded-xl"
                  disabled={placedNodes.length === 0}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Arrange
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex-1 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {/* Header - Simplified */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Your Pipeline
              </h2>
              <p className="text-sm text-muted-foreground">
                {placedNodes.length === 0
                  ? "Drag blocks here to start"
                  : `${placedNodes.length}/6 blocks • Click any block to configure`}
              </p>
            </div>

            {/* Train button - More prominent */}
            <Button
              onClick={handleTrain}
              disabled={!canTrain || isTraining}
              size="lg"
              className={cn(
                "bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold rounded-xl px-6 shadow-md",
                "hover:shadow-lg hover:scale-105 transition-all",
                !canTrain && "opacity-50 hover:scale-100"
              )}
            >
              {isTraining ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Train Model 🚀
                </>
              )}
            </Button>
          </header>

          {/* Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <DropCanvas onDrop={handleDrop} isEmpty={placedNodes.length === 0}>
              {/* Flow Connectors */}
              {connections.map((conn, i) => (
                <FlowConnector
                  key={i}
                  from={conn.from.position}
                  to={conn.to.position}
                  isActive={conn.isActive}
                  isCompleted={conn.isCompleted}
                />
              ))}

              {/* Placed Nodes */}
              {placedNodes.map((node) => {
                const config = nodeConfigs[node.type];
                const Icon = iconMap[node.type];
                return (
                  <CanvasNode
                    key={node.type}
                    id={node.type}
                    title={config.title}
                    description={config.description}
                    helpText={config.helpText}
                    icon={Icon}
                    color={config.color}
                    glowColor={config.glowColor}
                    borderColor={config.borderColor}
                    status={getStatus(node.type)}
                    isActive={activeNode === node.type}
                    onClick={() => handleNodeClick(node.type)}
                    onRemove={() => handleRemoveNode(node.type)}
                    onPositionChange={(pos) => handlePositionChange(node.type, pos)}
                    position={node.position}
                    dataset={dataset}
                  />
                );
              })}
            </DropCanvas>
          </div>
        </main>

        {/* Config Drawer */}
        {activeDrawer && (
          <ConfigDrawer
            isOpen={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setActiveDrawer(null);
            }}
            title={nodeConfigs[activeDrawer].title}
            description={nodeConfigs[activeDrawer].helpText}
            color={nodeConfigs[activeDrawer].color}
          >
            {renderDrawerContent()}
          </ConfigDrawer>
        )}

        {/* Training Overlay */}
        {isTraining && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card p-8 text-center animate-slide-up max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-model flex items-center justify-center animate-pulse-glow">
                <Brain className="w-10 h-10 text-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Training Your Model
              </h3>
              <p className="text-muted-foreground mb-4">
                Processing {dataset?.rows || 0} samples with{" "}
                {selectedModel === "logistic"
                  ? "Logistic Regression"
                  : selectedModel === "decision_tree"
                    ? "Decision Tree"
                    : selectedModel === "random_forest"
                      ? "Random Forest"
                      : selectedModel === "svm"
                        ? "SVM"
                        : selectedModel === "knn"
                          ? "KNN"
                          : selectedModel === "neural_network"
                            ? "Neural Network"
                            : "your model"}
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-model rounded-full transition-all duration-300"
                  style={{
                    width: "100%",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Modal */}
        {showResults && !isTraining && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <ResultsPanel
                isVisible={showResults}
                modelType={selectedModel}
                onClose={() => setShowResults(false)}
                datasetInfo={dataset ? {
                  rows: dataset.rows,
                  columns: dataset.columns,
                  fileName: dataset.fileName || "dataset.csv",
                } : undefined}
                splitRatio={splitRatio / 100}
                trainingResults={trainingResults}
              />
            </div>
          </div>
        )}

        {/* Tutorial Walkthrough */}
        <TutorialWalkthrough
          isOpen={showTutorial}
          onComplete={handleTutorialComplete}
        />
      </div>
    </DndProvider>
  );
}
