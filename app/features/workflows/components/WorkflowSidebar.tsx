/**
 * WorkflowSidebar - Persistent left sidebar for workflow navigation
 * Matches Power Automate reference: w-80, glass styling, scrollable list
 */

import { useState, useRef } from 'react';
import { Plus, Trash2, GitBranch, Search, Upload, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorkflowDocument } from '../types/workflow.types';
import { importWorkflow } from '../services/workflow-io';

interface WorkflowSidebarProps {
  workflows: WorkflowDocument[];
  selectedId: string | null;
  onSelect: (workflow: WorkflowDocument) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport?: (workflow: Omit<WorkflowDocument, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function WorkflowSidebar({
  workflows,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onImport,
}: WorkflowSidebarProps) {
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = workflows.filter((wf) =>
    wf.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importWorkflow(reader.result as string);
        onImport?.(imported);
        toast.success('Workflow imported');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import workflow');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="w-80 border-r border-border/50 bg-card/20 flex flex-col shrink-0 z-20">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">Your Workflows</h2>
        <button
          onClick={onCreate}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
          title="Create workflow"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flows..."
            className="w-full bg-card border border-border/50 rounded-lg py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-hide">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {search ? 'No matching workflows' : 'No workflows yet'}
            </p>
            {!search && (
              <button
                onClick={onCreate}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Create your first flow
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((wf) => (
              <div
                key={wf.id}
                role="button"
                onClick={() => onSelect(wf)}
                className={cn(
                  'relative px-3 py-3 rounded-lg cursor-pointer group transition-all',
                  selectedId === wf.id
                    ? 'bg-card border border-border/80 shadow-sm'
                    : 'hover:bg-card/50 border border-transparent'
                )}
              >
                {/* Active indicator bar */}
                {selectedId === wf.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={cn(
                      'text-sm font-medium truncate block',
                      selectedId === wf.id ? 'text-foreground' : 'text-foreground/80'
                    )}>
                      {wf.name}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full',
                        'bg-muted/50'
                      )}>
                        {wf.steps.length} {wf.steps.length === 1 ? 'step' : 'steps'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(wf.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(wf.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — Import */}
      <div className="border-t border-border/50 p-3 shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground bg-card/50 border border-border/50 hover:border-border transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import Workflow
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </aside>
  );
}
