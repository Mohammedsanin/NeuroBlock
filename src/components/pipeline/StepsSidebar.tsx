import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import { NodeStatus } from "./CanvasNode";

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
  status: NodeStatus;
}

interface StepsSidebarProps {
  steps: Step[];
  activeStep: number;
  onStepClick: (step: number) => void;
}

const simpleLabels: Record<number, { title: string; hint: string }> = {
  0: { title: "1. Add Data", hint: "Upload your file" },
  1: { title: "2. Clean Data", hint: "Prepare your data" },
  2: { title: "3. Add Features", hint: "Optional step" },
  3: { title: "4. Split Data", hint: "For testing" },
  4: { title: "5. Pick Model", hint: "Choose AI type" },
  5: { title: "6. See Results", hint: "View accuracy" },
};

export function StepsSidebar({ steps, activeStep, onStepClick }: StepsSidebarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h3 className="font-display text-base font-bold text-foreground">
          Follow These Steps
        </h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Complete each step from top to bottom. Click any step to configure it.
      </p>

      {steps.map((step) => {
        const Icon = step.icon;
        const isCompleted = step.status === "completed";
        const isConfigured = step.status === "configured";
        const isActive = activeStep === step.id;
        const info = simpleLabels[step.id];

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group",
              isActive && "bg-primary/10 ring-2 ring-primary/30",
              isCompleted && !isActive && "bg-secondary/10",
              !isActive && !isCompleted && "hover:bg-muted/70"
            )}
          >
            {/* Status indicator */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isCompleted && "bg-secondary text-secondary-foreground",
                isConfigured && !isCompleted && "bg-primary text-primary-foreground",
                !isCompleted && !isConfigured && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" strokeWidth={3} />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-semibold text-sm",
                isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {info.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCompleted ? "✓ Done!" : isConfigured ? "Ready" : info.hint}
              </p>
            </div>

            {/* Arrow indicator */}
            {!isCompleted && !isConfigured && (
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Circle className="w-3 h-3 text-accent fill-accent" />
              </div>
            )}
          </button>
        );
      })}

      {/* Simple progress indicator */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{steps.filter(s => s.status === "completed" || s.status === "configured").length} of {steps.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
            style={{ 
              width: `${(steps.filter(s => s.status === "completed" || s.status === "configured").length / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}