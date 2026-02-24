/**
 * WorkflowResults - Accordion showing execution results per step
 * Each item: status icon + method badge + step name + response details
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import { CheckCircle, XCircle, Clock, MinusCircle, Loader2 } from 'lucide-react';
import type { StepExecutionResult, WorkflowStep } from '../types/workflow.types';

interface WorkflowResultsProps {
  steps: WorkflowStep[];
  results: StepExecutionResult[];
}

function StatusIcon({ status }: { status: StepExecutionResult['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    case 'failure':
      return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
    case 'running':
      return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />;
    case 'skipped':
      return <MinusCircle className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  }
}

export function WorkflowResults({ steps, results }: WorkflowResultsProps) {
  if (results.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Run the workflow to see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-medium text-foreground mb-2">Results</h3>
      <Accordion type="multiple" className="space-y-1">
        {results.map((result) => {
          const step = steps.find((s) => s.id === result.stepId);
          if (!step) return null;

          const colors = getMethodColor(step.request.method);

          return (
            <AccordionItem
              key={result.stepId}
              value={result.stepId}
              className={cn(
                'border border-border rounded-md overflow-hidden',
                result.status === 'skipped' && 'opacity-50'
              )}
            >
              <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-2 flex-1">
                  <StatusIcon status={result.status} />
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-bold uppercase',
                    colors.bg, colors.text
                  )}>
                    {step.request.method}
                  </span>
                  <span className="text-foreground truncate">{step.name}</span>
                  {result.response && (
                    <span className="ml-auto text-muted-foreground text-xs">
                      {result.response.status} · {result.response.time}ms
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {result.error && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2 mb-2">
                    {result.error}
                  </div>
                )}
                {result.response && (
                  <div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                      <span>Status: <span className={cn(
                        'font-medium',
                        result.response.status >= 200 && result.response.status < 300
                          ? 'text-green-500'
                          : 'text-destructive'
                      )}>
                        {result.response.status} {result.response.statusText}
                      </span></span>
                      <span>{result.response.time}ms</span>
                      <span>{result.response.size.toFixed(1)} KB</span>
                    </div>
                    <pre className="text-xs font-mono text-foreground bg-muted rounded-md p-2 max-h-40 overflow-auto">
                      {typeof result.response.body === 'object'
                        ? JSON.stringify(result.response.body, null, 2)
                        : String(result.response.body)}
                    </pre>
                  </div>
                )}
                {Object.keys(result.extractedVariables).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground font-medium">Extracted:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(result.extractedVariables).map(([name, value]) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary"
                        >
                          {name}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
