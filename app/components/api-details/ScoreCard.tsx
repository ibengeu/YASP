import { cn } from '@/lib/utils';

interface ScoreCardProps {
  label: string;
  score: number;
}

/**
 * ScoreCard Component
 * Displays a score with progress bar and status badge
 * Features:
 * - Score display with progress bar
 * - Status badge (Excellent/Good/Needs Attention/Critical)
 * - Color coding based on score
 * - Responsive design
 */
export function ScoreCard({ label, score }: ScoreCardProps) {
  const getStatusConfig = () => {
    if (score >= 90) {
      return {
        label: 'Excellent',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        barColor: 'bg-emerald-500',
      };
    }
    if (score >= 70) {
      return {
        label: 'Good',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        barColor: 'bg-blue-500',
      };
    }
    if (score >= 50) {
      return {
        label: 'Needs Attention',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        barColor: 'bg-amber-500',
      };
    }
    return {
      label: 'Critical',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      barColor: 'bg-destructive',
    };
  };

  const status = getStatusConfig();

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', status.color)}>
          {status.label}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-semibold text-card-foreground">{score}</div>
      </div>

      <div className="bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', status.barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
