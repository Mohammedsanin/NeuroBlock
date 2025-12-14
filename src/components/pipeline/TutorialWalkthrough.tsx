import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Sparkles, Database, Wand2, Scissors, Brain, BarChart3, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tip: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to NeuroBlocks! 🎉",
    description: "Build machine learning models without writing any code. Just drag, drop, and click!",
    icon: Sparkles,
    color: "from-primary to-secondary",
    tip: "💡 This takes about 2 minutes to learn"
  },
  {
    title: "Step 1: Add Your Data",
    description: "Drag the 📁 Data block to the canvas and upload a CSV file. This is the data your AI will learn from.",
    icon: Database,
    color: "from-blue-500 to-blue-600",
    tip: "Only CSV files work right now"
  },
  {
    title: "Step 2: Clean Your Data (Optional)",
    description: "The 🧹 Clean block helps prepare your data. It's optional but can improve results!",
    icon: Wand2,
    color: "from-purple-500 to-purple-600",
    tip: "Skip this if your data is already clean"
  },
  {
    title: "Step 3: Split Your Data (Optional)",
    description: "The ✂️ Split block divides data into training and testing sets. Default is 70/30.",
    icon: Scissors,
    color: "from-cyan-500 to-cyan-600",
    tip: "We'll use default settings if you skip this"
  },
  {
    title: "Step 4: Pick Your Model",
    description: "Drag the 🤖 Model block and choose an AI algorithm. Random Forest is great for beginners!",
    icon: Brain,
    color: "from-orange-500 to-orange-600",
    tip: "Each model works differently - experiment!"
  },
  {
    title: "Step 5: See Results",
    description: "Click 'Train Model' and watch the magic! The 📊 Results will show how accurate your AI is.",
    icon: BarChart3,
    color: "from-emerald-500 to-emerald-600",
    tip: "Higher accuracy = better predictions"
  },
  {
    title: "You're Ready! 🚀",
    description: "That's it! Start with Data + Model for quick results, or add more blocks for better accuracy.",
    icon: Rocket,
    color: "from-primary to-secondary",
    tip: "Minimum needed: Data + Model"
  }
];

interface TutorialWalkthroughProps {
  onComplete: () => void;
  isOpen: boolean;
}

export function TutorialWalkthrough({ onComplete, isOpen }: TutorialWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onComplete]);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === tutorialSteps.length - 1;
  const isFirst = currentStep === 0;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[200]" onClick={onComplete} />
      
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[90vw] max-w-md animate-slide-up">
        <div className="bg-card rounded-3xl shadow-2xl border-2 border-border overflow-hidden">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-4 pb-2">
            {tutorialSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentStep ? "bg-primary w-6" : "bg-muted hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={cn(
              "w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              step.color
            )}>
              <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Tip */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              💡 {step.tip}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirst}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {tutorialSteps.length}
            </span>

            {isLast ? (
              <Button
                onClick={onComplete}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl font-semibold"
              >
                Start Building!
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="rounded-xl"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Skip button */}
          <button
            onClick={onComplete}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}