import { useEffect, useRef } from "react";
import CompanyLogo from "@/components/CompanyLogo";
import { cn } from "@/lib/utils";
import type { MetricBar } from "@/data/company-metrics";

const CHART_HEIGHT = 240;
const USABLE_HEIGHT = CHART_HEIGHT - 28; // leave room above bars for value labels

export default function MetricBarChart({
  bars,
  max,
  average,
  highlightName,
  format,
  showValues = true,
  testid,
}: {
  bars: MetricBar[];
  max: number;
  average: number;
  highlightName: string;
  format: (v: number) => string;
  showValues?: boolean;
  testid?: string;
}) {
  const avgOffset = (average / max) * USABLE_HEIGHT;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) return;
    const target =
      active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollLeft = Math.max(0, target);
  }, [highlightName]);

  return (
    <div ref={scrollRef} className="overflow-x-auto pb-2" data-testid={testid}>
      <div className="inline-block min-w-full px-1">
        {/* Bars + average line */}
        <div
          className="relative flex items-end gap-2"
          style={{ height: CHART_HEIGHT }}
        >
          {bars.map((b) => {
            const isActive = b.name === highlightName;
            const h = Math.max((b.value / max) * USABLE_HEIGHT, 2);
            return (
              <div
                key={b.name}
                ref={isActive ? activeRef : undefined}
                className="flex w-10 shrink-0 flex-col items-center justify-end"
                style={{ height: CHART_HEIGHT }}
              >
                {showValues && (
                  <span
                    className={cn(
                      "mb-1 text-[10px] tabular-nums whitespace-nowrap",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(b.value)}
                  </span>
                )}
                <div
                  className={cn(
                    "w-full",
                    isActive ? "bg-foreground" : "bg-muted"
                  )}
                  style={{ height: h }}
                  data-testid={`bar-${b.name}`}
                />
              </div>
            );
          })}

          {/* Average reference line */}
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-muted-foreground/60"
            style={{ bottom: avgOffset }}
          >
            <span className="absolute -top-2.5 left-0 bg-background px-1 text-[10px] text-muted-foreground">
              Average: {format(average)}
            </span>
          </div>
        </div>

        {/* Rank + logo row, aligned with bars above */}
        <div className="mt-2 flex gap-2">
          {bars.map((b) => {
            const isActive = b.name === highlightName;
            return (
              <div
                key={b.name}
                className="flex w-10 shrink-0 flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  #{b.rank}
                </span>
                <CompanyLogo name={b.name} className="h-7 w-7" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
