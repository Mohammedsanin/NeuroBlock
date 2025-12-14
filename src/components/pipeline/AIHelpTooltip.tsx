import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, Sparkles, Loader2, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BlockType } from "./DraggableBlock";
import { ParsedData } from "./DatasetUpload";

interface AIHelpTooltipProps {
  stepType: BlockType;
  dataset: ParsedData | null;
  staticHelp: string;
}

// Simple, friendly guides for beginners
const simpleGuides: Record<BlockType, { 
  title: string; 
  whatIs: string;
  steps: string[]; 
  tip: string;
  emoji: string;
}> = {
  dataset: {
    title: "Upload Your Data",
    emoji: "📁",
    whatIs: "This is where you add your data file. The AI will learn from this data.",
    steps: [
      "Click the upload button",
      "Pick a CSV or Excel file from your computer",
      "Wait for it to load - you'll see a preview"
    ],
    tip: "Use a file with column headers in the first row!"
  },
  preprocess: {
    title: "Clean Your Data",
    emoji: "🧹",
    whatIs: "This step makes your numbers easier for the AI to understand.",
    steps: [
      "Turn on 'Standardize' to center your data around zero",
      "Or use 'Normalize' to scale everything between 0 and 1",
      "Pick one or both - the AI will work better!"
    ],
    tip: "If unsure, just turn on Standardization - it works great!"
  },
  split: {
    title: "Split Your Data",
    emoji: "✂️",
    whatIs: "We split data into two parts: one to teach the AI, one to test it.",
    steps: [
      "Use the slider to choose how much data to use for teaching",
      "70-80% for teaching is usually perfect",
      "The rest is used to check how well the AI learned"
    ],
    tip: "Think of it like studying (training) then taking a test (testing)!"
  },
  feature: {
    title: "Prepare Features",
    emoji: "✨",
    whatIs: "This optional step helps fix messy data and create useful patterns.",
    steps: [
      "Fill in missing values automatically",
      "Convert text like 'Yes/No' into numbers",
      "Let the AI find patterns in your data"
    ],
    tip: "Skip this if your data is already clean!"
  },
  model: {
    title: "Pick Your AI Model",
    emoji: "🤖",
    whatIs: "Different AI models work better for different types of problems.",
    steps: [
      "Read the simple descriptions for each model",
      "Click on one to select it",
      "The settings below will adjust automatically"
    ],
    tip: "Random Forest is great for beginners - it's accurate and forgiving!"
  },
  results: {
    title: "See Your Results",
    emoji: "📊",
    whatIs: "After training, you'll see how well your AI performed!",
    steps: [
      "Check the Accuracy score - higher is better!",
      "Look at the charts to understand the results",
      "Compare different models if you want"
    ],
    tip: "90%+ accuracy is excellent! 70-90% is good for most projects."
  },
};

export function AIHelpTooltip({ stepType, dataset, staticHelp }: AIHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);

  const guide = simpleGuides[stepType];

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setShowAI(false);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const fetchExplanation = async () => {
    if (explanation) {
      setShowAI(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowAI(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("explain-step", {
        body: {
          stepType,
          datasetInfo: dataset
            ? {
                fileName: dataset.fileName,
                rows: dataset.rows,
                columns: dataset.columns,
                columnTypes: dataset.columnTypes,
              }
            : null,
        },
      });

      if (fnError) throw fnError;
      
      setExplanation(data.explanation);
    } catch (err: any) {
      console.error("Error fetching explanation:", err);
      setError("Couldn't load AI explanation.");
      setExplanation(staticHelp);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Help button - more visible */}
      <button
        className={cn(
          "p-2.5 rounded-xl transition-all duration-200 group",
          "bg-accent/20 hover:bg-accent/30 border-2 border-accent/50 hover:border-accent",
          "shadow-md hover:shadow-lg"
        )}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title="Need help? Click here!"
      >
        <HelpCircle className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]"
            onClick={() => { setIsOpen(false); setShowAI(false); }}
          />
          
          {/* Modal - simplified and friendly */}
          <div
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]",
              "w-[90vw] max-w-lg p-0 rounded-2xl shadow-2xl border-2",
              "bg-card border-border overflow-hidden animate-slide-up"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with emoji */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-border">
              <button
                onClick={() => { setIsOpen(false); setShowAI(false); }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-4">
                <div className="text-4xl">{guide.emoji}</div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {guide.whatIs}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {!showAI ? (
                <>
                  {/* Simple numbered steps */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">?</span>
                      How to do it:
                    </h4>
                    <div className="space-y-2 ml-2">
                      {guide.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tip section */}
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-accent">Pro Tip!</p>
                        <p className="text-sm text-foreground mt-1">{guide.tip}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Help button */}
                  <Button
                    onClick={fetchExplanation}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl py-6 font-semibold text-base"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get AI Help For My Data
                  </Button>
                </>
              ) : (
                /* AI Response */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">AI Explanation</h4>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Analyzing your data...</p>
                    </div>
                  ) : error ? (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {explanation}
                      </p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowAI(false)}
                    className="w-full rounded-xl"
                  >
                    ← Back to Guide
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}