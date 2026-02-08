/**
 * WorkflowList - Grid of workflow cards when no specific workflow is selected
 * Shows name, step count, last updated, with create + delete actions
 */

import { Plus, Trash2, GitBranch, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkflowDocument } from '../types/workflow.types';

interface WorkflowListProps {
  workflows: WorkflowDocument[];
  onSelect: (workflow: WorkflowDocument) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function WorkflowList({
  workflows,
  onSelect,
  onCreate,
  onDelete,
}: WorkflowListProps) {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Workflows</h2>
          <p className="text-sm text-muted-foreground">
            Chain API requests to test multi-step sequences
          </p>
        </div>
        <Button onClick={onCreate} size="sm">
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border border-border">
          <GitBranch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No workflows yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Create your first workflow to chain API requests together
          </p>
          <Button onClick={onCreate} size="sm">
            <Plus className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              role="button"
              onClick={() => onSelect(wf)}
              className={cn(
                'bg-card rounded-lg border border-border p-4',
                'hover:border-primary transition-colors cursor-pointer group',
                'flex items-center justify-between'
              )}
            >
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">{wf.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>{wf.steps.length} {wf.steps.length === 1 ? 'step' : 'steps'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(wf.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(wf.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
