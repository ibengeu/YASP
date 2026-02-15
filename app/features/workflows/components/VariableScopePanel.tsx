/**
 * VariableScopePanel - Shows accumulated workflow variables
 * Displays extracted variables with their values, source step, and copy button
 */

import { Copy, Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VariableScopePanelProps {
  variables: Record<string, any>;
  availableVariables: { name: string; stepName: string; stepId: string }[];
}

export function VariableScopePanel({
  variables,
  availableVariables,
}: VariableScopePanelProps) {
  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    toast.success(`Copied {{${name}}} to clipboard`);
  };

  if (availableVariables.length === 0 && Object.keys(variables).length === 0) {
    return (
      <div className="p-4 text-center">
        <Variable className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          No variables yet. Add extractions to steps to create variables.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1.5">
      <h3 className="text-xs font-medium text-foreground mb-2">Variables</h3>
      {availableVariables.map((v) => {
        const value = variables[v.name];
        const hasValue = value !== undefined;
        return (
          <div
            key={`${v.stepId}-${v.name}`}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs',
              'bg-muted/50 hover:bg-muted transition-colors group'
            )}
          >
            <code className="font-mono text-blue-600 dark:text-blue-400 font-medium">
              {v.name}
            </code>
            <span className="text-muted-foreground text-[10px] truncate flex-1">
              {hasValue ? (
                <span className="text-foreground">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              ) : (
                <span className="italic">from {v.stepName}</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleCopy(v.name)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title={`Copy {{${v.name}}}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
