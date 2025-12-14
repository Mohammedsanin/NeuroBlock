import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check, X, Eye, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataVisualization } from "./DataVisualization";

interface DatasetUploadProps {
  onUpload: (data: ParsedData | null) => void;
  dataset: ParsedData | null;
}

export interface ParsedData {
  fileName: string;
  fileSize: string;
  rows: number;
  columns: string[];
  columnTypes: Record<string, "numeric" | "text" | "categorical">;
  preview: Record<string, string | number>[];
}

type ViewMode = "info" | "preview" | "charts";

export function DatasetUpload({ onUpload, dataset }: DatasetUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("info");
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(undefined);

  const parseCSV = (text: string): Record<string, string | number>[] => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    
    return lines.slice(1, 11).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string | number> = {};
      headers.forEach((header, i) => {
        const val = values[i] || "";
        row[header] = isNaN(Number(val)) ? val : Number(val);
      });
      return row;
    });
  };

  const detectColumnTypes = (
    data: Record<string, string | number>[],
    columns: string[]
  ): Record<string, "numeric" | "text" | "categorical"> => {
    const types: Record<string, "numeric" | "text" | "categorical"> = {};
    
    columns.forEach((col) => {
      const values = data.map((row) => row[col]);
      const numericCount = values.filter((v) => typeof v === "number").length;
      const uniqueCount = new Set(values).size;
      
      if (numericCount > values.length * 0.8) {
        types[col] = "numeric";
      } else if (uniqueCount < values.length * 0.5 && uniqueCount < 10) {
        types[col] = "categorical";
      } else {
        types[col] = "text";
      }
    });
    
    return types;
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
        const text = await file.text();
        const lines = text.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        const preview = parseCSV(text);
        const columnTypes = detectColumnTypes(preview, headers);

        const parsedData: ParsedData = {
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          rows: lines.length - 1,
          columns: headers,
          columnTypes,
          preview,
        };

        onUpload(parsedData);
        toast.success("Dataset uploaded successfully!");
      } catch (e) {
        setError("Failed to parse the file. Please check the format.");
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (dataset && viewMode === "info") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/30">
          <div className="w-10 h-10 rounded-lg gradient-data flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{dataset.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {dataset.rows} rows • {dataset.columns.length} columns • {dataset.fileSize}
            </p>
          </div>
          <Check className="w-5 h-5 text-accent animate-scale-bounce" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("preview")}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
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
            {isDragging ? "Drop your file here" : "Drag your dataset"}
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
