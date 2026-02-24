/**
 * WorkflowStepCard - Glass morphism step card for the workflow canvas
 * Method icon box + step info + hover actions + execution status badge
 */

import { useState, useRef, useEffect } from 'react';
import {
  Trash2, ChevronDown as Expand, ChevronUp as Collapse,
  Variable, GripVertical, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import type { WorkflowStep, StepExecutionResult, VariableExtraction } from '../types/workflow.types';
import { ExtractionEditor } from './ExtractionEditor';
import { pulseElement, successFlash, failureShake } from '@/lib/animations';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  executionResult?: StepExecutionResult;
  availableVariables: { name: string; stepName: string; stepId: string }[];
  specName?: string;
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onRemove: () => void;
  onAddExtraction: (extraction: VariableExtraction) => void;
  onRemoveExtraction: (extractionId: string) => void;
}

export function WorkflowStepCard({
  step,
  index: _index,
  executionResult,
  availableVariables: _availableVariables,
  specName,
  onUpdate,
  onRemove,
  onAddExtraction,
  onRemoveExtraction,
}: WorkflowStepCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const status = executionResult?.status;
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (!cardRef.current || status === prevStatus) return;

    if (status === 'running') {
      const anim = pulseElement(cardRef.current);
      return () => { anim.pause(); };
    } else if (status === 'success') {
      successFlash(cardRef.current);
    } else if (status === 'failure') {
      failureShake(cardRef.current);
    }
  }, [executionResult?.status]);

  const [isExpanded, setIsExpanded] = useState(false);
  const methodColors = getMethodColor(step.request.method);

  // Variable references in this step
  const usedVars = new Set<string>();
  const varPattern = /\{\{(\w+)\}\}/g;
  const fieldsToCheck = [
    step.request.path,
    step.request.body || '',
    ...Object.values(step.request.headers),
    ...Object.values(step.request.queryParams),
  ];
  for (const field of fieldsToCheck) {
    let match;
    while ((match = varPattern.exec(field)) !== null) {
      usedVars.add(match[1]);
    }
  }

  return (
    <div ref={setNodeRef} style={sortableStyle} {...attributes} className="w-full max-w-md group">
      <div
        ref={cardRef}
        className={cn(
          'relative glass-panel rounded-xl shadow-sm p-4',
          'hover:border-border transition-all',
          executionResult?.status === 'failure' && 'border-destructive/50',
          executionResult?.status === 'success' && 'border-green-500/50',
        )}
      >
        {/* Execution status badge */}
        {executionResult?.status && executionResult.status !== 'pending' && (
          <div className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-card border border-border shadow-md flex items-center justify-center">
            {executionResult.status === 'success' && (
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            )}
            {executionResult.status === 'failure' && (
              <XCircle className="w-3.5 h-3.5 text-destructive" />
            )}
            {executionResult.status === 'running' && (
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            )}
          </div>
        )}

        {/* Header: Method icon + content + hover actions */}
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none mt-1"
            tabIndex={-1}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Method icon box */}
          <div className={cn(
            'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
            methodColors.bg, methodColors.border
          )}>
            <span className={cn('text-xs font-bold uppercase', methodColors.text)}>
              {step.request.method}
            </span>
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {step.name}
              </span>
              {specName && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground truncate max-w-[100px] shrink-0">
                  {specName}
                </span>
              )}
            </div>
            <code className="text-xs text-muted-foreground font-mono truncate block mt-0.5">
              {step.request.path}
            </code>
            {/* Execution time inline */}
            {executionResult?.response && (
              <span className="text-xs text-muted-foreground">
                {executionResult.response.status} · {executionResult.response.time}ms
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded
                ? <Collapse className="w-3.5 h-3.5" />
                : <Expand className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Extraction pills + variable usage indicators */}
        <div className="flex items-center gap-1 mt-2.5 flex-wrap">
          {step.extractions.map((ext) => (
            <ExtractionEditor
              key={ext.id}
              extraction={ext}
              lastResponseBody={executionResult?.response?.body}
              onRemove={() => onRemoveExtraction(ext.id)}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs text-muted-foreground px-1.5"
            onClick={() => onAddExtraction({
              id: crypto.randomUUID(),
              name: '',
              jsonPath: '',
            })}
          >
            + Extract
          </Button>
          {usedVars.size > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-2">
              <Variable className="w-3 h-3" />
              {Array.from(usedVars).join(', ')}
            </span>
          )}
        </div>

        {/* Expanded config */}
        {isExpanded && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {/* Editable step name */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Step Name</Label>
              <Input
                value={step.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="h-7 text-xs mt-1"
                placeholder="Step name"
              />
            </div>

            {/* Headers */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Headers</Label>
              {Object.entries(step.request.headers).map(([key, value], i) => (
                <div key={i} className="flex gap-2 mt-1">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newHeaders = { ...step.request.headers };
                      delete newHeaders[key];
                      newHeaders[e.target.value] = value;
                      onUpdate({ request: { ...step.request, headers: newHeaders } });
                    }}
                    placeholder="Header name"
                    className="h-6 text-xs flex-1"
                  />
                  <Input
                    value={value}
                    onChange={(e) => {
                      onUpdate({
                        request: {
                          ...step.request,
                          headers: { ...step.request.headers, [key]: e.target.value },
                        },
                      });
                    }}
                    placeholder="Value (supports {{var}})"
                    className="h-6 text-xs flex-1 font-mono"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs text-muted-foreground mt-1"
                onClick={() => {
                  onUpdate({
                    request: {
                      ...step.request,
                      headers: { ...step.request.headers, '': '' },
                    },
                  });
                }}
              >
                + Header
              </Button>
            </div>

            {/* Query Params */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Query Params</Label>
              {Object.entries(step.request.queryParams).map(([key, value], i) => (
                <div key={i} className="flex gap-2 mt-1">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newParams = { ...step.request.queryParams };
                      delete newParams[key];
                      newParams[e.target.value] = value;
                      onUpdate({ request: { ...step.request, queryParams: newParams } });
                    }}
                    placeholder="Param name"
                    className="h-6 text-xs flex-1"
                  />
                  <Input
                    value={value}
                    onChange={(e) => {
                      onUpdate({
                        request: {
                          ...step.request,
                          queryParams: { ...step.request.queryParams, [key]: e.target.value },
                        },
                      });
                    }}
                    placeholder="Value"
                    className="h-6 text-xs flex-1 font-mono"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs text-muted-foreground mt-1"
                onClick={() => {
                  onUpdate({
                    request: {
                      ...step.request,
                      queryParams: { ...step.request.queryParams, '': '' },
                    },
                  });
                }}
              >
                + Param
              </Button>
            </div>

            {/* Body */}
            {['POST', 'PUT', 'PATCH'].includes(step.request.method) && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Body</Label>
                <textarea
                  value={step.request.body || ''}
                  onChange={(e) => onUpdate({
                    request: { ...step.request, body: e.target.value },
                  })}
                  placeholder='{"key": "{{variable}}"}'
                  className="w-full mt-1 px-2 py-1.5 text-xs font-mono bg-muted border border-border rounded-md min-h-[60px] resize-y text-foreground"
                />
              </div>
            )}

            {/* Error display */}
            {executionResult?.error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
                {executionResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
