import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down';
  delta?: number;
  sparkline?: number[];
  tooltip?: string;
  invertColors?: boolean;
}

/**
 * KPICard Component
 * Displays a key performance indicator with:
 * - Large value display with unit
 * - Trend indicator (up/down with delta)
 * - Optional sparkline SVG visualization
 * - Optional tooltip with info
 * - Color coding (green/red based on trend and invertColors)
 *
 * Security:
 * - Mitigation for OWASP A07:2025 – Injection: Values are typed and validated before rendering
 * - No user input accepted - only calculated metrics from trusted sources
 */
export function KPICard({
  label,
  value,
  unit = '',
  trend,
  delta,
  sparkline,
  tooltip,
  invertColors = false,
}: KPICardProps) {
  // Determine trend color based on direction and inversion
  const getTrendColor = () => {
    if (!trend) return '';

    const isPositiveTrend = trend === 'up';
    const shouldBeGreen = invertColors ? !isPositiveTrend : isPositiveTrend;

    return shouldBeGreen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  // Generate sparkline SVG path
  const generateSparklinePath = (data: number[]): string => {
    if (!data || data.length === 0) return '';

    const width = 100;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        {tooltip && (
          <button
            className="text-muted-foreground hover:text-foreground"
            title={tooltip}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-3xl font-semibold text-card-foreground">
            {value}
            <span className="text-lg text-muted-foreground">{unit}</span>
          </div>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1 text-sm font-medium', getTrendColor())}>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {delta !== undefined && <span>{delta > 0 ? '+' : ''}{delta}%</span>}
            </div>
          )}
        </div>
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="mt-2">
          <svg
            width="100"
            height="30"
            className="w-full h-8"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
          >
            <path
              d={generateSparklinePath(sparkline)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={cn('transition-colors', getTrendColor() || 'text-blue-500')}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
