/**
 * WorkflowStepCard - Individual step in the workflow builder
 * Railway-track dot + method badge + path + extractions + reorder controls
 */

import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Trash2, Copy, ChevronDown as Expand, ChevronUp as Collapse,
  Variable,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { getMethodColor } from '@/lib/constants';
import type { WorkflowStep, StepExecutionResult, VariableExtraction } from '../types/workflow.types';
import { ExtractionEditor } from './ExtractionEditor';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  totalSteps: number;
  executionResult?: StepExecutionResult;
  availableVariables: { name: string; stepName: string; stepId: string }[];
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onRemove: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  onDuplicate: () => void;
  onAddExtraction: (extraction: VariableExtraction) => void;
  onRemoveExtraction: (extractionId: string) => void;
}

export function WorkflowStepCard({
  step,
  index,
  totalSteps,
  executionResult,
  availableVariables: _availableVariables,
  onUpdate,
  onRemove,
  onReorder,
  onDuplicate,
  onAddExtraction,
  onRemoveExtraction,
}: WorkflowStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const methodColors = getMethodColor(step.request.method);

  // Railway dot color based on execution status
  const getDotColor = () => {
    if (!executionResult) return 'bg-muted-foreground/30';
    switch (executionResult.status) {
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'success': return 'bg-emerald-500';
      case 'failure': return 'bg-destructive';
      case 'skipped': return 'bg-muted-foreground/20';
      default: return 'bg-muted-foreground/30';
    }
  };

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
    <div className="flex gap-3 group">
      {/* Railway track */}
      <div className="flex flex-col items-center pt-4">
        <div className={cn('w-3 h-3 rounded-full shrink-0 border-2 border-background', getDotColor())} />
        {index < totalSteps - 1 && (
          <div className="w-0.5 flex-1 bg-border mt-1" />
        )}
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 bg-card rounded-lg border border-border p-3 mb-2',
        'hover:border-primary/50 transition-colors',
        executionResult?.status === 'failure' && 'border-destructive/50',
        executionResult?.status === 'success' && 'border-emerald-500/50',
      )}>
        {/* Header row */}
        <div className="flex items-center gap-2">
          {/* Method badge */}
          <span className={cn(
            'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
            methodColors.bg, methodColors.text, methodColors.border, 'border'
          )}>
            {step.request.method}
          </span>

          {/* Path (monospace) */}
          <code className="text-xs text-foreground font-mono truncate flex-1">
            {step.request.path}
          </code>

          {/* Execution time */}
          {executionResult?.response && (
            <span className="text-[10px] text-muted-foreground">
              {executionResult.response.status} · {executionResult.response.time}ms
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => onReorder('up')}
              disabled={index === 0}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => onReorder('down')}
              disabled={index === totalSteps - 1}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onDuplicate}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded
                ? <Collapse className="w-3.5 h-3.5" />
                : <Expand className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* Step name (editable) */}
        <Input
          value={step.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-6 text-xs border-transparent hover:border-border mt-1 px-1"
          placeholder="Step name"
        />

        {/* Extraction pills + variable usage indicators */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
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
            className="h-5 text-[10px] text-muted-foreground px-1.5"
            onClick={() => onAddExtraction({
              id: crypto.randomUUID(),
              name: '',
              jsonPath: '',
            })}
          >
            + Extract
          </Button>
          {usedVars.size > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-2">
              <Variable className="w-3 h-3" />
              {Array.from(usedVars).join(', ')}
            </span>
          )}
        </div>

        {/* Expanded config */}
        {isExpanded && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            {/* Headers */}
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase">Headers</Label>
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
                className="h-5 text-[10px] text-muted-foreground mt-1"
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
              <Label className="text-[10px] text-muted-foreground uppercase">Query Params</Label>
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
                className="h-5 text-[10px] text-muted-foreground mt-1"
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
                <Label className="text-[10px] text-muted-foreground uppercase">Body</Label>
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
