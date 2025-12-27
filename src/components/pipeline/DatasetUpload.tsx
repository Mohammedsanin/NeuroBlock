import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, X, Eye, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataVisualization } from "./DataVisualization";
import { FeatureTargetSelector } from "./FeatureTargetSelector";
import { uploadDataset, UploadResponse, ColumnInfo } from "@/lib/api";

interface DatasetUploadProps {
  onUpload: (data: ParsedData | null) => void;
  dataset: ParsedData | null;
  onFeatureTargetSelect?: (inputFeatures: string[], targetVariable: string) => void;
}

export interface ParsedData {
  fileName: string;
  fileSize: string;
  rows: number;
  columns: string[];
  columnTypes: Record<string, "numeric" | "text" | "categorical">;
  preview: Record<string, string | number>[];
  sessionId?: string;
  columnInfo?: Record<string, ColumnInfo>;
  inputFeatures?: string[];
  targetVariable?: string;
}

type ViewMode = "info" | "preview" | "charts" | "feature-select";

export function DatasetUpload({ onUpload, dataset, onFeatureTargetSelect }: DatasetUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("info");
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(undefined);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
        setError("Unsupported format. Please upload a CSV or Excel file.");
        setIsLoading(false);
        return;
      }

      try {
        // Upload to backend
        const response: UploadResponse = await uploadDataset(file);

        // Convert backend response to ParsedData format
        const columnTypes: Record<string, "numeric" | "text" | "categorical"> = {};
        Object.entries(response.column_info).forEach(([col, info]) => {
          columnTypes[col] = info.type;
        });

        const parsedData: ParsedData = {
          fileName: response.file_name,
          fileSize: formatFileSize(file.size),
          rows: response.rows,
          columns: response.columns,
          columnTypes,
          preview: response.preview,
          sessionId: response.session_id,
          columnInfo: response.column_info,
        };

        onUpload(parsedData);
        toast.success("Dataset uploaded successfully!");

        // Automatically show feature selection after upload
        setViewMode("feature-select");
      } catch (e: any) {
        setError(e.message || "Failed to upload file. Make sure the backend server is running.");
        toast.error("Upload failed. Is the backend server running?");
      } finally {
        setIsLoading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFeatureTargetConfirm = (inputFeatures: string[], targetVariable: string) => {
    if (dataset) {
      const updatedDataset: ParsedData = {
        ...dataset,
        inputFeatures,
        targetVariable,
      };
      onUpload(updatedDataset);

      if (onFeatureTargetSelect) {
        onFeatureTargetSelect(inputFeatures, targetVariable);
      }

      toast.success(`Selected ${inputFeatures.length} features and target: ${targetVariable}`);
      setViewMode("info");
    }
  };

  // Feature Selection View
  if (dataset && viewMode === "feature-select") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Select Features & Target</h4>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("info")}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <FeatureTargetSelector
          columns={dataset.columns}
          columnInfo={dataset.columnInfo || {}}
          onConfirm={handleFeatureTargetConfirm}
          onCancel={() => setViewMode("info")}
        />
      </div>
    );
  }

  // Info View (Dataset uploaded)
  if (dataset && viewMode === "info") {
    const hasFeatureSelection = dataset.inputFeatures && dataset.targetVariable;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/30">
          <div className="w-10 h-10 rounded-lg gradient-data flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{dataset.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {dataset.rows} rows • {dataset.columns.length} columns
            </p>
          </div>
          <Check className="w-5 h-5 text-accent animate-scale-bounce" />
        </div>

        {hasFeatureSelection && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
            <p className="text-sm font-medium text-foreground mb-1">Configuration</p>
            <p className="text-xs text-muted-foreground">
              {dataset.inputFeatures!.length} input features → {dataset.targetVariable}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("feature-select")}
            className={cn(!hasFeatureSelection && "border-primary text-primary")}
          >
            <Settings className="w-4 h-4 mr-2" />
            {hasFeatureSelection ? "Change" : "Select"} Features
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setViewMode("charts");
              if (!selectedColumn && dataset.columns.length > 0) {
                setSelectedColumn(dataset.columns[0]);
              }
            }}
            className="flex-1"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Charts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpload(null)}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Preview View
  if (dataset && viewMode === "preview") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Data Preview</h4>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("info")}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {dataset.columns.slice(0, 6).map((col) => (
            <span
              key={col}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                dataset.columnTypes[col] === "numeric" && "bg-pipeline-data/20 text-pipeline-data",
                dataset.columnTypes[col] === "categorical" && "bg-pipeline-process/20 text-pipeline-process",
                dataset.columnTypes[col] === "text" && "bg-muted text-muted-foreground"
              )}
            >
              {col}
            </span>
          ))}
          {dataset.columns.length > 6 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              +{dataset.columns.length - 6} more
            </span>
          )}
        </div>

        <div className="overflow-x-auto max-h-48 rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {dataset.columns.slice(0, 5).map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.preview.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-border/50">
                  {dataset.columns.slice(0, 5).map((col) => (
                    <td key={col} className="px-3 py-2 text-foreground">
                      {String(row[col]).slice(0, 20)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Charts View
  if (dataset && viewMode === "charts") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Data Visualization</h4>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("info")}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <DataVisualization
          dataset={dataset}
          selectedColumn={selectedColumn}
          onColumnSelect={setSelectedColumn}
        />
      </div>
    );
  }

  // Upload View (No dataset)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/30 hover:border-primary/50",
        isLoading && "pointer-events-none opacity-50"
      )}
    >
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isDragging ? "gradient-data" : "bg-muted"
          )}
        >
          <Upload className={cn("w-6 h-6", isDragging ? "text-foreground" : "text-muted-foreground")} />
        </div>

        <div>
          <p className="font-medium text-foreground">
            {isLoading ? "Uploading..." : isDragging ? "Drop your file here" : "Drag your dataset"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">CSV or Excel format</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-destructive text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
