import { useMemo } from "react";
import { ParsedData } from "./DatasetUpload";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { BarChart2, PieChart as PieChartIcon, Hash, Type, Tag } from "lucide-react";

interface DataVisualizationProps {
  dataset: ParsedData;
  selectedColumn?: string;
  onColumnSelect?: (column: string) => void;
}

interface ColumnStats {
  name: string;
  type: "numeric" | "text" | "categorical";
  count: number;
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  distribution?: Array<{ name: string; value: number }>;
}

const COLORS = [
  "hsl(var(--pipeline-data))",
  "hsl(var(--pipeline-process))",
  "hsl(var(--pipeline-model))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
];

export function DataVisualization({
  dataset,
  selectedColumn,
  onColumnSelect,
}: DataVisualizationProps) {
  const columnStats = useMemo(() => {
    const stats: ColumnStats[] = [];

    dataset.columns.forEach((col) => {
      const values = dataset.preview.map((row) => row[col]);
      const type = dataset.columnTypes[col];
      const numericValues = values.filter((v) => typeof v === "number") as number[];
      const missing = values.filter((v) => v === null || v === undefined || v === "").length;
      const unique = new Set(values).size;

      const stat: ColumnStats = {
        name: col,
        type,
        count: values.length,
        missing,
        unique,
      };

      if (type === "numeric" && numericValues.length > 0) {
        stat.min = Math.min(...numericValues);
        stat.max = Math.max(...numericValues);
        stat.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

        // Create histogram bins
        const binCount = 5;
        const range = stat.max - stat.min;
        const binSize = range / binCount || 1;
        const bins: number[] = Array(binCount).fill(0);

        numericValues.forEach((v) => {
          const binIndex = Math.min(Math.floor((v - stat.min!) / binSize), binCount - 1);
          bins[binIndex]++;
        });

        stat.distribution = bins.map((count, i) => ({
          name: `${(stat.min! + i * binSize).toFixed(1)}`,
          value: count,
        }));
      } else if (type === "categorical" || type === "text") {
        // Count value occurrences
        const counts: Record<string, number> = {};
        values.forEach((v) => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });

        stat.distribution = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name: name.slice(0, 10), value }));
      }

      stats.push(stat);
    });

    return stats;
  }, [dataset]);

  const selectedStats = selectedColumn
    ? columnStats.find((s) => s.name === selectedColumn)
    : null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "numeric":
        return Hash;
      case "categorical":
        return Tag;
      default:
        return Type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Column selector chips */}
      <div className="flex flex-wrap gap-2">
        {columnStats.map((stat) => {
          const Icon = getTypeIcon(stat.type);
          return (
            <button
              key={stat.name}
              onClick={() => onColumnSelect?.(stat.name)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedColumn === stat.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              <Icon className="w-3 h-3" />
              {stat.name.length > 12 ? stat.name.slice(0, 12) + "..." : stat.name}
            </button>
          );
        })}
      </div>

      {/* Column details */}
      {selectedStats && (
        <div className="space-y-4 animate-fade-in">
          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Count</p>
              <p className="font-mono font-bold text-foreground">{selectedStats.count}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Unique</p>
              <p className="font-mono font-bold text-foreground">{selectedStats.unique}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Missing</p>
              <p className="font-mono font-bold text-foreground">{selectedStats.missing}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-mono font-bold text-foreground capitalize">
                {selectedStats.type.slice(0, 5)}
              </p>
            </div>
          </div>

          {/* Numeric-specific stats */}
          {selectedStats.type === "numeric" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-pipeline-data/10 text-center">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="font-mono font-bold text-pipeline-data">
                  {selectedStats.min?.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-pipeline-process/10 text-center">
                <p className="text-xs text-muted-foreground">Mean</p>
                <p className="font-mono font-bold text-pipeline-process">
                  {selectedStats.mean?.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-pipeline-model/10 text-center">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="font-mono font-bold text-pipeline-model">
                  {selectedStats.max?.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Distribution chart */}
          {selectedStats.distribution && selectedStats.distribution.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                {selectedStats.type === "numeric" ? (
                  <BarChart2 className="w-4 h-4 text-pipeline-data" />
                ) : (
                  <PieChartIcon className="w-4 h-4 text-pipeline-process" />
                )}
                <span className="text-sm font-medium text-foreground">Distribution</span>
              </div>

              {selectedStats.type === "numeric" ? (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedStats.distribution}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--pipeline-data))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedStats.distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        innerRadius={25}
                      >
                        {selectedStats.distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1 text-xs">
                    {selectedStats.distribution.slice(0, 4).map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No column selected hint */}
      {!selectedColumn && (
        <div className="p-6 rounded-xl bg-muted/20 border border-dashed border-border text-center">
          <BarChart2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Click a column above to view statistics and distribution
          </p>
        </div>
      )}
    </div>
  );
}
