/**
 * ExecutionResultsPanel - Slide-up bottom panel showing execution results
 * Three-column table layout: step label | HTTP status | response output
 * Glass-morphism header with status indicator, duration, and completion state
 */

import { X, CheckCircle, XCircle, Loader2, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkflowStep, StepExecutionResult } from '../types/workflow.types';

interface ExecutionResultsPanelProps {
  steps: WorkflowStep[];
  results: StepExecutionResult[];
  isOpen: boolean;
  onClose: () => void;
  startedAt?: string;
  completedAt?: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted';
}

function StatusIcon({ status }: { status: StepExecutionResult['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    case 'failure':
      return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />;
    case 'skipped':
      return <MinusCircle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />;
    default:
      return <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />;
  }
}

function getDuration(startedAt?: string, completedAt?: string): string {
  if (!startedAt || !completedAt) return '';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getStatusLabel(
  status: ExecutionResultsPanelProps['status'],
  allSuccess: boolean,
  hasFailed: boolean,
): string {
  if (status === 'running') return 'Running...';
  if (status === 'completed' && allSuccess) return 'Run Successful';
  if (status === 'failed' || (status === 'completed' && hasFailed)) return 'Run Failed';
  if (status === 'aborted') return 'Run Aborted';
  return 'Results';
}

function getCompletionLabel(status: ExecutionResultsPanelProps['status']): string {
  if (status === 'running') return 'In Progress';
  if (status === 'completed') return 'Completed';
  if (status === 'failed') return 'Failed';
  if (status === 'aborted') return 'Aborted';
  return 'Idle';
}

export function ExecutionResultsPanel({
  steps,
  results,
  isOpen,
  onClose,
  startedAt,
  completedAt,
  status,
}: ExecutionResultsPanelProps) {
  const duration = getDuration(startedAt, completedAt);
  const allSuccess = results.length > 0 && results.every((r) => r.status === 'success');
  const hasFailed = results.some((r) => r.status === 'failure');
  const statusLabel = getStatusLabel(status, allSuccess, hasFailed);
  const completionLabel = getCompletionLabel(status);

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-40 shadow-2xl flex flex-col',
        'bg-card/95 backdrop-blur-xl border-t border-border/50',
        'transition-transform duration-500 ease-out',
        isOpen ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{ height: '18rem' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 bg-muted/20 shrink-0">
        <div className="flex items-center gap-4">
          {/* Status indicator + label */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              status === 'running' && 'bg-blue-500 animate-pulse',
              (status === 'completed' && allSuccess) && 'bg-emerald-500',
              (status === 'failed' || hasFailed) && 'bg-destructive',
              status === 'aborted' && 'bg-amber-500',
              status === 'idle' && 'bg-muted-foreground/30',
            )} />
            <span className={cn(
              'text-xs font-bold tracking-wide uppercase',
              (status === 'completed' && allSuccess) && 'text-emerald-600 dark:text-emerald-400',
              (status === 'failed' || hasFailed) && 'text-destructive',
              status === 'running' && 'text-blue-600 dark:text-blue-400',
              status === 'aborted' && 'text-amber-600 dark:text-amber-400',
              status === 'idle' && 'text-muted-foreground',
            )}>
              {statusLabel}
            </span>
          </div>

          {/* Duration */}
          {duration && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground font-mono">
                Duration: <span className="text-foreground">{duration}</span>
              </span>
            </>
          )}

          {/* Completion status */}
          {status !== 'idle' && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs text-muted-foreground font-mono">
                Status: <span className="text-foreground">{completionLabel}</span>
              </span>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Results table */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">No results yet</p>
          </div>
        ) : (
          results.map((result, i) => {
            const step = steps.find((s) => s.id === result.stepId);
            if (!step) return null;

            const hasResponse = !!result.response;
            const isSuccess = result.status === 'success';
            const statusCode = result.response
              ? `${result.response.status} ${result.response.statusText}`
              : result.error ? 'Error' : '-';

            const outputSummary = result.response
              ? `Executed ${step.name} successfully. Output: ${typeof result.response.body === 'object'
                  ? JSON.stringify(result.response.body).slice(0, 100)
                  : String(result.response.body).slice(0, 100)}`
              : result.error || '';

            return (
              <div
                key={result.stepId}
                className="flex border-b border-border/30"
              >
                {/* Step label column */}
                <div className="w-48 shrink-0 p-3 border-r border-border/30 bg-muted/10 flex items-center gap-2">
                  <StatusIcon status={result.status} />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>

                {/* HTTP status column */}
                <div className="w-24 shrink-0 p-3 border-r border-border/30 flex items-center">
                  <span className={cn(
                    'text-xs font-mono font-medium',
                    hasResponse && isSuccess && 'text-emerald-600 dark:text-emerald-400',
                    hasResponse && !isSuccess && 'text-destructive',
                    !hasResponse && result.error && 'text-destructive',
                    !hasResponse && !result.error && 'text-muted-foreground',
                  )}>
                    {statusCode}
                  </span>
                </div>

                {/* Output / response summary column */}
                <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                  <span className={cn(
                    'text-xs font-mono truncate',
                    isSuccess ? 'text-muted-foreground' : 'text-destructive',
                  )}>
                    {outputSummary}
                  </span>

                  {/* Duration badge */}
                  {result.response && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {result.response.time}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
