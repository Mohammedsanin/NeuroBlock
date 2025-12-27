import { useState } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ColumnInfo } from "@/lib/api";

interface FeatureTargetSelectorProps {
    columns: string[];
    columnInfo: Record<string, ColumnInfo>;
    onConfirm: (inputFeatures: string[], targetVariable: string) => void;
    onCancel: () => void;
}

export function FeatureTargetSelector({
    columns,
    columnInfo,
    onConfirm,
    onCancel,
}: FeatureTargetSelectorProps) {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [targetVariable, setTargetVariable] = useState<string>("");
    const [error, setError] = useState<string>("");

    const handleFeatureToggle = (column: string) => {
        setError("");
        setSelectedFeatures((prev) =>
            prev.includes(column)
                ? prev.filter((f) => f !== column)
                : [...prev, column]
        );
    };

    const handleTargetChange = (column: string) => {
        setError("");
        setTargetVariable(column);
    };

    const handleConfirm = () => {
        // Validation
        if (selectedFeatures.length === 0) {
            setError("Please select at least one input feature");
            return;
        }

        if (!targetVariable) {
            setError("Please select a target variable");
            return;
        }

        if (selectedFeatures.includes(targetVariable)) {
            setError("Target variable cannot be an input feature");
            return;
        }

        onConfirm(selectedFeatures, targetVariable);
    };

    const getColumnTypeColor = (type: string) => {
        switch (type) {
            case "numeric":
                return "bg-pipeline-data/20 text-pipeline-data border-pipeline-data/30";
            case "categorical":
                return "bg-pipeline-process/20 text-pipeline-process border-pipeline-process/30";
            default:
                return "bg-muted text-muted-foreground border-border";
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h3 className="font-medium text-foreground mb-2">Configure Your Model</h3>
                <p className="text-sm text-muted-foreground">
                    Select which columns to use as input features and which one to predict (target).
                </p>
            </div>

            {/* Input Features Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Input Features</h4>
                    <span className="text-xs text-muted-foreground">
                        {selectedFeatures.length} selected
                    </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {columns.map((column) => {
                        const info = columnInfo[column];
                        const isSelected = selectedFeatures.includes(column);
                        const isTarget = targetVariable === column;

                        return (
                            <div
                                key={column}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                    isSelected && !isTarget
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-card border-border hover:border-primary/20",
                                    isTarget && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Checkbox
                                    id={`feature-${column}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleFeatureToggle(column)}
                                    disabled={isTarget}
                                    className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                    <Label
                                        htmlFor={`feature-${column}`}
                                        className="font-medium text-foreground cursor-pointer"
                                    >
                                        {column}
                                    </Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className={cn(
                                                "text-xs px-2 py-0.5 rounded-full border",
                                                getColumnTypeColor(info.type)
                                            )}
                                        >
                                            {info.type}
                                        </span>
                                        {info.missing_count > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {info.missing_percentage.toFixed(1)}% missing
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Target Variable Selection */}
            <div className="space-y-3">
                <h4 className="font-medium text-foreground">Target Variable (to predict)</h4>

                <RadioGroup value={targetVariable} onValueChange={handleTargetChange}>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {columns.map((column) => {
                            const info = columnInfo[column];
                            const isFeature = selectedFeatures.includes(column);

                            return (
                                <div
                                    key={column}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                        targetVariable === column && !isFeature
                                            ? "bg-accent/10 border-accent/30"
                                            : "bg-card border-border hover:border-accent/20",
                                        isFeature && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <RadioGroupItem
                                        value={column}
                                        id={`target-${column}`}
                                        disabled={isFeature}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <Label
                                            htmlFor={`target-${column}`}
                                            className="font-medium text-foreground cursor-pointer"
                                        >
                                            {column}
                                        </Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span
                                                className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full border",
                                                    getColumnTypeColor(info.type)
                                                )}
                                            >
                                                {info.type}
                                            </span>
                                            {info.unique_values && (
                                                <span className="text-xs text-muted-foreground">
                                                    {info.unique_values} unique values
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </RadioGroup>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-gradient-to-r from-secondary to-primary"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Selection
                </Button>
                <Button onClick={onCancel} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
            </div>
        </div>
    );
}
